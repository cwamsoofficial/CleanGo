-- Fix 1: Update redeem_points function to require authorization
-- Users can only redeem their own points
CREATE OR REPLACE FUNCTION public.redeem_points(_user_id uuid, _points integer, _description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_points integer;
BEGIN
  -- CRITICAL: Verify caller owns the account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF auth.uid() != _user_id THEN
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

  -- Check if user has enough points
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

  -- Record transaction with negative points for redeemed
  INSERT INTO public.reward_transactions (user_id, points, type, description)
  VALUES (_user_id, -_points, 'redeemed', _description);
END;
$function$;

-- Fix 2: Drop the overly permissive collector profile policy
-- Collectors already have access to names via get_public_profile() and get_pickup_requester_names() functions
DROP POLICY IF EXISTS "Collectors can view profiles of assigned work" ON public.profiles;