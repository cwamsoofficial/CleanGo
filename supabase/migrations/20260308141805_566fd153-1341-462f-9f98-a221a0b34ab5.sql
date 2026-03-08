-- Fix award_points: revoke direct public access, only callable from other SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow calls from trusted server-side contexts (other SECURITY DEFINER functions)
  -- or from admins directly
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: award_points can only be called by admins or system functions';
  END IF;

  -- Validate inputs
  IF _points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;
  
  IF _points > 1000 THEN
    RAISE EXCEPTION 'Cannot award more than 1000 points at once';
  END IF;

  -- Update rewards atomically
  UPDATE public.rewards
  SET 
    points = points + _points,
    total_earned = total_earned + _points,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Record transaction
  INSERT INTO public.reward_transactions (user_id, points, type, description)
  VALUES (_user_id, _points, 'earned', _description);
END;
$$;

-- Fix redeem_points: enforce caller owns the account
CREATE OR REPLACE FUNCTION public.redeem_points(_user_id uuid, _points integer, _description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_points integer;
BEGIN
  -- Verify caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only the owner or an admin can redeem points
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: You can only redeem your own points';
  END IF;

  -- Validate inputs
  IF _points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;

  -- Get current points with row lock to prevent race conditions
  SELECT points INTO current_points
  FROM public.rewards
  WHERE user_id = _user_id
  FOR UPDATE;

  IF current_points IS NULL THEN
    RAISE EXCEPTION 'User rewards record not found';
  END IF;

  IF current_points < _points THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Update rewards atomically
  UPDATE public.rewards
  SET 
    points = points - _points,
    total_redeemed = total_redeemed + _points,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Record transaction
  INSERT INTO public.reward_transactions (user_id, points, type, description)
  VALUES (_user_id, -_points, 'redeemed', _description);
END;
$$;

-- Revoke direct RPC access to award_points for regular authenticated users
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_points(uuid, integer, text) FROM anon;