-- Create user_streaks table to track participation streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can view their own streaks
CREATE POLICY "Users can view their own streaks"
ON public.user_streaks
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all streaks
CREATE POLICY "Admins can view all streaks"
ON public.user_streaks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Deny direct user modifications (will be managed by triggers)
CREATE POLICY "Deny direct user inserts to streaks"
ON public.user_streaks
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny direct user updates to streaks"
ON public.user_streaks
FOR UPDATE
USING (false);

-- Function to update user streak and award bonus points
CREATE OR REPLACE FUNCTION public.update_user_streak(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_last_activity_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_days_since_last integer;
  v_bonus_points integer := 0;
  v_bonus_description text;
BEGIN
  -- Get or create user streak record
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
  VALUES (_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current streak data
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity_date, v_current_streak, v_longest_streak
  FROM public.user_streaks
  WHERE user_id = _user_id
  FOR UPDATE;

  -- Calculate days since last activity
  IF v_last_activity_date IS NULL THEN
    v_days_since_last := 999; -- First activity ever
  ELSE
    v_days_since_last := CURRENT_DATE - v_last_activity_date;
  END IF;

  -- Update streak based on days since last activity
  IF v_days_since_last = 0 THEN
    -- Same day, no streak update
    RETURN;
  ELSIF v_days_since_last = 1 THEN
    -- Consecutive day, increment streak
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;

  -- Update longest streak if necessary
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Determine bonus points based on streak milestones
  IF v_current_streak = 3 THEN
    v_bonus_points := 50;
    v_bonus_description := '3-day streak bonus';
  ELSIF v_current_streak = 7 THEN
    v_bonus_points := 150;
    v_bonus_description := '7-day streak bonus';
  ELSIF v_current_streak = 14 THEN
    v_bonus_points := 300;
    v_bonus_description := '14-day streak bonus';
  ELSIF v_current_streak = 30 THEN
    v_bonus_points := 1000;
    v_bonus_description := '30-day streak milestone';
  ELSIF v_current_streak > 30 AND v_current_streak % 30 = 0 THEN
    v_bonus_points := 500;
    v_bonus_description := FORMAT('%s-day streak milestone', v_current_streak);
  END IF;

  -- Update streak record
  UPDATE public.user_streaks
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Award base points for pickup completion (20 points)
  PERFORM award_points(_user_id, 20, 'Pickup completion');

  -- Award bonus points if milestone reached
  IF v_bonus_points > 0 THEN
    PERFORM award_points(_user_id, v_bonus_points, v_bonus_description);
  END IF;
END;
$$;

-- Trigger function to handle pickup completion
CREATE OR REPLACE FUNCTION public.handle_pickup_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process when status changes to 'collected'
  IF NEW.status = 'collected' AND (OLD.status IS NULL OR OLD.status != 'collected') THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on waste_pickups
DROP TRIGGER IF EXISTS trigger_pickup_completion ON public.waste_pickups;
CREATE TRIGGER trigger_pickup_completion
AFTER INSERT OR UPDATE ON public.waste_pickups
FOR EACH ROW
EXECUTE FUNCTION public.handle_pickup_completion();