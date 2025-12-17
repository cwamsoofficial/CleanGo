-- Fix 1: Add CHECK constraints for issue_reports input validation
ALTER TABLE public.issue_reports
ADD CONSTRAINT check_title_length CHECK (LENGTH(title) >= 1 AND LENGTH(title) <= 200),
ADD CONSTRAINT check_description_length CHECK (LENGTH(description) >= 10 AND LENGTH(description) <= 2000),
ADD CONSTRAINT check_location_length CHECK (location IS NULL OR LENGTH(location) <= 500);

-- Fix 2: Add IP-based rate limiting function
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(ip_addr text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts integer;
  v_max_attempts integer := 20; -- Max 20 attempts per IP in 15 minutes
  v_window interval := interval '15 minutes';
BEGIN
  -- Count recent attempts from this IP
  SELECT COUNT(*) INTO v_attempts 
  FROM public.login_attempts
  WHERE ip_address = ip_addr 
    AND created_at > NOW() - v_window;
  
  IF v_attempts >= v_max_attempts THEN
    RETURN json_build_object(
      'allowed', false,
      'attempts', v_attempts,
      'message', 'Too many login attempts from this IP. Please try again later.'
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true,
    'attempts', v_attempts,
    'remaining', v_max_attempts - v_attempts
  );
END;
$$;

-- Update handle_failed_login to check IP rate limit
CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email text, failure_reason text DEFAULT NULL::text, ip_addr text DEFAULT NULL::text, user_agent_str text DEFAULT NULL::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_failed_attempts integer;
  v_lockout_duration interval;
  v_ip_check json;
BEGIN
  -- Check IP rate limit first
  IF ip_addr IS NOT NULL THEN
    v_ip_check := check_ip_rate_limit(ip_addr);
    IF NOT (v_ip_check->>'allowed')::boolean THEN
      RETURN json_build_object(
        'locked', true,
        'ip_blocked', true,
        'message', v_ip_check->>'message'
      );
    END IF;
  END IF;

  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  
  -- Log the failed attempt
  INSERT INTO public.login_attempts (user_id, email, success, ip_address, user_agent, failure_reason)
  VALUES (v_user_id, user_email, false, ip_addr, user_agent_str, failure_reason);
  
  -- Increment failed attempts counter
  UPDATE public.profiles p
  SET 
    failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
    last_failed_login_at = now()
  FROM auth.users u
  WHERE u.id = p.id AND u.email = user_email
  RETURNING p.failed_login_attempts INTO v_failed_attempts;
  
  -- Lock account if 5 or more failed attempts
  IF v_failed_attempts >= 5 THEN
    -- Lock for 30 minutes
    v_lockout_duration := interval '30 minutes';
    
    UPDATE public.profiles p
    SET locked_until = now() + v_lockout_duration
    FROM auth.users u
    WHERE u.id = p.id AND u.email = user_email;
    
    RETURN json_build_object(
      'locked', true,
      'attempts', v_failed_attempts,
      'lockout_minutes', 30
    );
  END IF;
  
  RETURN json_build_object(
    'locked', false,
    'attempts', v_failed_attempts,
    'remaining_attempts', 5 - v_failed_attempts
  );
END;
$$;

-- Add index for faster IP lookups on login_attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_created 
ON public.login_attempts(ip_address, created_at DESC);