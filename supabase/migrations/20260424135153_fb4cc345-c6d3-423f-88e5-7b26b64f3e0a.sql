CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _description text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_is_trigger boolean;
BEGIN
  -- Detect if we're being called from within another function/trigger (trusted server context)
  -- pg_trigger_depth() > 0 means we're inside a trigger execution
  v_caller_is_trigger := pg_trigger_depth() > 0;

  -- Allow if: called from a trigger (trusted), called by an admin, or no auth context (system)
  IF NOT v_caller_is_trigger AND auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin') THEN
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
$function$;