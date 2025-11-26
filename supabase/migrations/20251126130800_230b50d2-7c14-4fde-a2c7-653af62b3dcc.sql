-- Create login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at DESC);

-- Add lockout tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for login_attempts
CREATE POLICY "Users can view their own login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login attempts"
  ON public.login_attempts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_locked_until timestamp with time zone;
BEGIN
  SELECT locked_until INTO v_locked_until
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = user_email;
  
  IF v_locked_until IS NULL THEN
    RETURN false;
  END IF;
  
  IF v_locked_until > now() THEN
    RETURN true;
  ELSE
    -- Lock expired, reset counters
    UPDATE public.profiles p
    SET 
      failed_login_attempts = 0,
      locked_until = NULL
    FROM auth.users u
    WHERE u.id = p.id AND u.email = user_email;
    
    RETURN false;
  END IF;
END;
$$;

-- Function to handle failed login attempt
CREATE OR REPLACE FUNCTION public.handle_failed_login(
  user_email text,
  failure_reason text DEFAULT NULL,
  ip_addr text DEFAULT NULL,
  user_agent_str text DEFAULT NULL
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
BEGIN
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

-- Function to handle successful login
CREATE OR REPLACE FUNCTION public.handle_successful_login(
  user_email text,
  ip_addr text DEFAULT NULL,
  user_agent_str text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  
  -- Log the successful attempt
  INSERT INTO public.login_attempts (user_id, email, success, ip_address, user_agent)
  VALUES (v_user_id, user_email, true, ip_addr, user_agent_str);
  
  -- Reset failed attempts counter
  UPDATE public.profiles p
  SET 
    failed_login_attempts = 0,
    last_failed_login_at = NULL,
    locked_until = NULL
  FROM auth.users u
  WHERE u.id = p.id AND u.email = user_email;
END;
$$;