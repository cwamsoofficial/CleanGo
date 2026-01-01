-- Fix 1: Collectors can only update their assigned reports (not all reports)
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Collectors can update reports" ON public.issue_reports;

-- Allow collectors to update only their assigned reports
CREATE POLICY "Collectors can update assigned reports"
  ON public.issue_reports FOR UPDATE
  USING (auth.uid() = assigned_collector_id)
  WITH CHECK (auth.uid() = assigned_collector_id);

-- Allow collectors to self-assign unassigned reports
CREATE POLICY "Collectors can claim unassigned reports"
  ON public.issue_reports FOR UPDATE
  USING (
    has_role(auth.uid(), 'collector'::app_role)
    AND assigned_collector_id IS NULL
  )
  WITH CHECK (
    -- Only allow setting assigned_collector_id to themselves
    assigned_collector_id = auth.uid()
  );

-- Fix 2: Revoke direct award_points access from client (prevent abuse)
-- Points will be awarded automatically by a trigger when issue is created
REVOKE EXECUTE ON FUNCTION public.award_points FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points FROM anon;

-- Create trigger to automatically award points when an issue report is created
CREATE OR REPLACE FUNCTION public.handle_issue_report_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award 3 points for reporting an issue
  PERFORM award_points(NEW.reporter_id, 3, 'Reported waste management issue');
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_issue_report_created ON public.issue_reports;

-- Create trigger for new issue reports
CREATE TRIGGER on_issue_report_created
  AFTER INSERT ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_issue_report_created();

-- Fix 3: Restrict is_account_locked function from direct client access
-- This prevents email enumeration attacks
REVOKE EXECUTE ON FUNCTION public.is_account_locked FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_account_locked FROM anon;

-- Only allow server-side/trigger usage
GRANT EXECUTE ON FUNCTION public.is_account_locked TO postgres, service_role;

-- Update handle_failed_login to include internal account lock check
-- This way clients only call handle_failed_login which returns generic responses
CREATE OR REPLACE FUNCTION public.handle_failed_login(
  user_email text, 
  failure_reason text DEFAULT NULL::text, 
  ip_addr text DEFAULT NULL::text, 
  user_agent_str text DEFAULT NULL::text
)
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
  v_is_locked boolean;
BEGIN
  -- Check IP rate limit first
  IF ip_addr IS NOT NULL THEN
    v_ip_check := check_ip_rate_limit(ip_addr);
    IF NOT (v_ip_check->>'allowed')::boolean THEN
      RETURN json_build_object(
        'locked', true,
        'ip_blocked', true,
        'message', 'Too many login attempts. Please try again later.'
      );
    END IF;
  END IF;

  -- Check if account is already locked (internal check, not exposed to client)
  SELECT locked_until > now() INTO v_is_locked
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = user_email;
  
  IF v_is_locked IS TRUE THEN
    RETURN json_build_object(
      'locked', true,
      'message', 'Too many failed login attempts. Please try again later.'
    );
  END IF;

  -- Get user ID (may be null for non-existent users)
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  
  -- Log the failed attempt
  INSERT INTO public.login_attempts (user_id, email, success, ip_address, user_agent, failure_reason)
  VALUES (v_user_id, user_email, false, ip_addr, user_agent_str, failure_reason);
  
  -- Only increment if user exists (prevents information leakage)
  IF v_user_id IS NOT NULL THEN
    -- Increment failed attempts counter
    UPDATE public.profiles p
    SET 
      failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
      last_failed_login_at = now()
    WHERE p.id = v_user_id
    RETURNING p.failed_login_attempts INTO v_failed_attempts;
    
    -- Lock account if 5 or more failed attempts
    IF v_failed_attempts >= 5 THEN
      -- Lock for 30 minutes
      v_lockout_duration := interval '30 minutes';
      
      UPDATE public.profiles
      SET locked_until = now() + v_lockout_duration
      WHERE id = v_user_id;
      
      RETURN json_build_object(
        'locked', true,
        'attempts', v_failed_attempts,
        'lockout_minutes', 30,
        'message', 'Account locked due to too many failed attempts.'
      );
    END IF;
    
    RETURN json_build_object(
      'locked', false,
      'attempts', v_failed_attempts,
      'remaining_attempts', 5 - v_failed_attempts
    );
  ELSE
    -- Generic response for non-existent users (prevents enumeration)
    RETURN json_build_object(
      'locked', false,
      'message', 'Invalid credentials'
    );
  END IF;
END;
$$;