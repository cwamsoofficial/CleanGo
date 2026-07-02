INSERT INTO public.system_settings (key, value, updated_at)
VALUES ('security_settings', jsonb_build_object(
  'max_failed_attempts', 5,
  'lockout_minutes', 30,
  'ip_max_attempts', 20,
  'ip_window_minutes', 15,
  'signup_enabled', true,
  'password_hibp_enabled', true
), now())
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_security_settings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(value, '{}'::jsonb) FROM public.system_settings WHERE key = 'security_settings';
$$;

CREATE OR REPLACE FUNCTION public.admin_update_security_settings(_settings jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_current jsonb; v_new jsonb;
  v_max_failed int; v_lockout int; v_ip_max int; v_ip_window int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can update security settings';
  END IF;
  SELECT COALESCE(value, '{}'::jsonb) INTO v_current FROM public.system_settings WHERE key = 'security_settings';
  v_current := COALESCE(v_current, '{}'::jsonb);
  v_new := v_current || COALESCE(_settings, '{}'::jsonb);
  v_max_failed := COALESCE((v_new->>'max_failed_attempts')::int, 5);
  v_lockout := COALESCE((v_new->>'lockout_minutes')::int, 30);
  v_ip_max := COALESCE((v_new->>'ip_max_attempts')::int, 20);
  v_ip_window := COALESCE((v_new->>'ip_window_minutes')::int, 15);
  IF v_max_failed < 3 OR v_max_failed > 20 THEN RAISE EXCEPTION 'max_failed_attempts must be between 3 and 20'; END IF;
  IF v_lockout < 1 OR v_lockout > 1440 THEN RAISE EXCEPTION 'lockout_minutes must be between 1 and 1440'; END IF;
  IF v_ip_max < 5 OR v_ip_max > 200 THEN RAISE EXCEPTION 'ip_max_attempts must be between 5 and 200'; END IF;
  IF v_ip_window < 1 OR v_ip_window > 240 THEN RAISE EXCEPTION 'ip_window_minutes must be between 1 and 240'; END IF;
  INSERT INTO public.system_settings (key, value, updated_at, updated_by)
  VALUES ('security_settings', v_new, now(), auth.uid())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now(), updated_by = auth.uid();
  PERFORM log_admin_action('security_settings_updated', jsonb_build_object('settings', v_new));
  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(ip_addr text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_attempts integer; v_settings jsonb; v_max_attempts integer; v_window interval;
BEGIN
  SELECT COALESCE(value, '{}'::jsonb) INTO v_settings FROM public.system_settings WHERE key = 'security_settings';
  v_max_attempts := COALESCE((v_settings->>'ip_max_attempts')::int, 20);
  v_window := (COALESCE((v_settings->>'ip_window_minutes')::int, 15) || ' minutes')::interval;
  SELECT COUNT(*) INTO v_attempts FROM public.login_attempts
  WHERE ip_address = ip_addr AND created_at > NOW() - v_window;
  IF v_attempts >= v_max_attempts THEN
    RETURN json_build_object('allowed', false, 'attempts', v_attempts,
      'message', 'Too many login attempts from this IP. Please try again later.');
  END IF;
  RETURN json_build_object('allowed', true, 'attempts', v_attempts, 'remaining', v_max_attempts - v_attempts);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email text, failure_reason text DEFAULT NULL::text, ip_addr text DEFAULT NULL::text, user_agent_str text DEFAULT NULL::text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid; v_failed_attempts integer; v_lockout_duration interval;
  v_ip_check json; v_is_locked boolean; v_settings jsonb;
  v_max_failed int; v_lockout_minutes int;
BEGIN
  SELECT COALESCE(value, '{}'::jsonb) INTO v_settings FROM public.system_settings WHERE key = 'security_settings';
  v_max_failed := COALESCE((v_settings->>'max_failed_attempts')::int, 5);
  v_lockout_minutes := COALESCE((v_settings->>'lockout_minutes')::int, 30);
  IF ip_addr IS NOT NULL THEN
    v_ip_check := check_ip_rate_limit(ip_addr);
    IF NOT (v_ip_check->>'allowed')::boolean THEN
      RETURN json_build_object('locked', true, 'ip_blocked', true,
        'message', 'Too many login attempts. Please try again later.');
    END IF;
  END IF;
  SELECT locked_until > now() INTO v_is_locked
  FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE u.email = user_email;
  IF v_is_locked IS TRUE THEN
    RETURN json_build_object('locked', true, 'message', 'Too many failed login attempts. Please try again later.');
  END IF;
  SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
  INSERT INTO public.login_attempts (user_id, email, success, ip_address, user_agent, failure_reason)
  VALUES (v_user_id, user_email, false, ip_addr, user_agent_str, failure_reason);
  IF v_user_id IS NOT NULL THEN
    UPDATE public.profiles p
    SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, last_failed_login_at = now()
    WHERE p.id = v_user_id RETURNING p.failed_login_attempts INTO v_failed_attempts;
    IF v_failed_attempts >= v_max_failed THEN
      v_lockout_duration := (v_lockout_minutes || ' minutes')::interval;
      UPDATE public.profiles SET locked_until = now() + v_lockout_duration WHERE id = v_user_id;
      RETURN json_build_object('locked', true, 'attempts', v_failed_attempts,
        'lockout_minutes', v_lockout_minutes,
        'message', 'Account locked due to too many failed attempts.');
    END IF;
    RETURN json_build_object('locked', false, 'attempts', v_failed_attempts,
      'remaining_attempts', v_max_failed - v_failed_attempts);
  ELSE
    RETURN json_build_object('locked', false, 'message', 'Invalid credentials');
  END IF;
END;
$$;