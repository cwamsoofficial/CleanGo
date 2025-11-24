-- Update referral completion to award 50 points (₦500) instead of 100 points
CREATE OR REPLACE FUNCTION public.process_referral_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_referral_record RECORD;
  v_first_pickup boolean;
BEGIN
  -- Only process when status changes to 'collected'
  IF NEW.status = 'collected' AND (OLD.status IS NULL OR OLD.status != 'collected') THEN
    
    -- Check if this is the user's first completed pickup
    SELECT COUNT(*) = 1 INTO v_first_pickup
    FROM public.waste_pickups
    WHERE user_id = NEW.user_id
      AND status = 'collected';
    
    -- If first pickup, check for pending referral
    IF v_first_pickup THEN
      SELECT * INTO v_referral_record
      FROM public.user_referrals
      WHERE referred_user_id = NEW.user_id
        AND status = 'pending'
      FOR UPDATE;
      
      -- If referral exists, award points to referrer
      IF FOUND THEN
        -- Award 50 points to referrer (₦500)
        PERFORM award_points(v_referral_record.referrer_id, 50, 'Referral bonus - friend completed first pickup');
        
        -- Update referral status
        UPDATE public.user_referrals
        SET 
          status = 'completed',
          completed_at = now(),
          points_awarded = 50,
          updated_at = now()
        WHERE id = v_referral_record.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update pickup completion to award 5 points (₦50) instead of 10 points
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

  -- Award base points for pickup completion (5 points = ₦50)
  PERFORM award_points(_user_id, 5, 'Pickup completion');

  -- Award bonus points if milestone reached
  IF v_bonus_points > 0 THEN
    PERFORM award_points(_user_id, v_bonus_points, v_bonus_description);
  END IF;
END;
$function$;