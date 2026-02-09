
CREATE OR REPLACE FUNCTION public.update_user_streak(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_activity_date date;
  v_current_streak integer;
  v_longest_streak integer;
  v_days_since_last integer;
  v_bonus_points integer := 0;
  v_bonus_description text;
  v_tier text;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO v_tier
  FROM public.profiles
  WHERE id = _user_id;

  -- Normal (non-subscribed) users earn no points
  IF v_tier IS NULL THEN
    RETURN;
  END IF;

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
    v_days_since_last := 999;
  ELSE
    v_days_since_last := CURRENT_DATE - v_last_activity_date;
  END IF;

  -- Update streak based on days since last activity
  IF v_days_since_last = 0 THEN
    RETURN;
  ELSIF v_days_since_last = 1 THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  -- Update longest streak if necessary
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  -- Determine streak milestone bonuses
  IF v_current_streak = 14 THEN
    v_bonus_points := 100;
    v_bonus_description := '14-day streak bonus';
  ELSIF v_current_streak = 30 THEN
    v_bonus_points := 200;
    v_bonus_description := '30-day streak milestone';
  ELSIF v_current_streak > 30 AND v_current_streak % 30 = 0 THEN
    v_bonus_points := 200;
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

  -- Award points based on tier
  IF v_tier = 'pro' THEN
    -- Pro: 1 base point + 2 bonus points = 3 total
    PERFORM award_points(_user_id, 1, 'Pickup completion');
    PERFORM award_points(_user_id, 2, 'Premium Pro bonus');
  ELSIF v_tier = 'basic' THEN
    -- Basic: 1 point per pickup
    PERFORM award_points(_user_id, 1, 'Pickup completion');
  END IF;

  -- Award streak bonus points if milestone reached
  IF v_bonus_points > 0 THEN
    PERFORM award_points(_user_id, v_bonus_points, v_bonus_description);
  END IF;
END;
$function$;
