-- Add RLS policies to deny direct user manipulation of rewards
CREATE POLICY "Deny direct user updates to rewards"
ON public.rewards FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny direct user inserts to rewards"
ON public.rewards FOR INSERT
TO authenticated
WITH CHECK (false);

-- Add RLS policies to deny direct user manipulation of reward_transactions
CREATE POLICY "Deny direct user inserts to transactions"
ON public.reward_transactions FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny direct user updates to transactions"
ON public.reward_transactions FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny direct user deletes to transactions"
ON public.reward_transactions FOR DELETE
TO authenticated
USING (false);

-- Create secure function to award points (used when users earn points)
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id uuid,
  _points integer,
  _description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

-- Create secure function to redeem points (used when users spend points)
CREATE OR REPLACE FUNCTION public.redeem_points(
  _user_id uuid,
  _points integer,
  _description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_points integer;
BEGIN
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
$$;