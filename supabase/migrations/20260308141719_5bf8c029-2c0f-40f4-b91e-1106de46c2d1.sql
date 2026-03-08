CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested_role text;
  v_safe_role app_role;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );

  -- Sanitize role: only allow safe public roles from self-signup
  -- Admin role can ONLY be assigned by existing admins via admin dashboard
  v_requested_role := NEW.raw_user_meta_data->>'role';
  v_safe_role := CASE v_requested_role
    WHEN 'citizen'   THEN 'citizen'
    WHEN 'collector'  THEN 'collector'
    WHEN 'company'   THEN 'company'
    ELSE 'citizen'
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_safe_role);

  -- Initialize rewards
  INSERT INTO public.rewards (user_id, points, total_earned, total_redeemed)
  VALUES (NEW.id, 0, 0, 0);

  RETURN NEW;
END;
$$;