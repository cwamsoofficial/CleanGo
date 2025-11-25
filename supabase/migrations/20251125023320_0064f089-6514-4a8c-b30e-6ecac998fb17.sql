-- Drop the existing function
DROP FUNCTION IF EXISTS public.validate_admin_key(text, text, text);

-- Recreate the function with new parameter names
CREATE OR REPLACE FUNCTION public.validate_admin_key(
  input_key text,
  user_email text,
  user_ip text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key_record RECORD;
  v_key_hash TEXT;
  v_result JSON;
BEGIN
  -- Hash the provided key for comparison
  v_key_hash := encode(digest(input_key, 'sha256'), 'hex');
  
  -- Log the attempt
  INSERT INTO public.admin_key_attempts (key_attempted, email, ip_address, success, error_reason)
  VALUES (v_key_hash, user_email, user_ip, false, 'Validation in progress');
  
  -- Find matching key
  SELECT * INTO v_key_record
  FROM public.admin_keys
  WHERE key_hash = v_key_hash;
  
  -- Check if key exists
  IF NOT FOUND THEN
    UPDATE public.admin_key_attempts
    SET error_reason = 'Invalid key'
    WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
      SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'invalid',
      'message', 'The Admin Key you entered is incorrect. Please contact the system administrator.'
    );
  END IF;
  
  -- Check if key is revoked
  IF v_key_record.status = 'revoked' THEN
    UPDATE public.admin_key_attempts
    SET error_reason = 'Revoked key'
    WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
      SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'revoked',
      'message', 'This Admin Key is no longer active. Access has been restricted.'
    );
  END IF;
  
  -- Check if key is expired by status
  IF v_key_record.status = 'expired' THEN
    UPDATE public.admin_key_attempts
    SET error_reason = 'Expired key (status)'
    WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
      SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'expired',
      'message', 'This Admin Key has expired. Request a new authorization key.'
    );
  END IF;
  
  -- Check if key is expired by date
  IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < now() THEN
    UPDATE public.admin_key_attempts
    SET error_reason = 'Expired key (date)'
    WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
      SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'expired',
      'message', 'This Admin Key has expired. Request a new authorization key.'
    );
  END IF;
  
  -- Check if key has reached max uses
  IF v_key_record.max_uses IS NOT NULL AND v_key_record.current_uses >= v_key_record.max_uses THEN
    UPDATE public.admin_key_attempts
    SET error_reason = 'Max uses reached'
    WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
      SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
    );
    
    RETURN json_build_object(
      'valid', false,
      'error', 'expired',
      'message', 'This Admin Key has expired. Request a new authorization key.'
    );
  END IF;
  
  -- Key is valid, increment usage
  UPDATE public.admin_keys
  SET current_uses = current_uses + 1
  WHERE id = v_key_record.id;
  
  -- Update attempt log as successful
  UPDATE public.admin_key_attempts
  SET success = true, error_reason = NULL
  WHERE key_attempted = v_key_hash AND email = user_email AND created_at = (
    SELECT MAX(created_at) FROM public.admin_key_attempts WHERE key_attempted = v_key_hash AND email = user_email
  );
  
  RETURN json_build_object(
    'valid', true,
    'message', 'Admin Key validated successfully.'
  );
END;
$$;