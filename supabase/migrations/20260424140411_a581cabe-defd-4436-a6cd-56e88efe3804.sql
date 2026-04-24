-- Audit log table
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  admin_email text,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny direct inserts to audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny audit log updates"
  ON public.admin_audit_log FOR UPDATE
  USING (false);

CREATE POLICY "Deny audit log deletes"
  ON public.admin_audit_log FOR DELETE
  USING (false);

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log (action);

-- System settings table
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON public.system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny direct setting writes"
  ON public.system_settings FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct setting updates"
  ON public.system_settings FOR UPDATE
  USING (false);

-- Seed: rewards currently disabled (matches recent reset)
INSERT INTO public.system_settings (key, value)
VALUES ('rewards_enabled', jsonb_build_object('enabled', false))
ON CONFLICT (key) DO NOTHING;

-- Helper: log an admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(_action text, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, details)
  VALUES (auth.uid(), v_email, _action, COALESCE(_details, '{}'::jsonb));
END;
$$;

-- Toggle rewards enabled/disabled
CREATE OR REPLACE FUNCTION public.admin_set_rewards_enabled(_enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change reward settings';
  END IF;

  INSERT INTO public.system_settings (key, value, updated_at, updated_by)
  VALUES ('rewards_enabled', jsonb_build_object('enabled', _enabled), now(), auth.uid())
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now(),
        updated_by = auth.uid();

  -- Enable or disable the point-awarding triggers accordingly
  IF _enabled THEN
    EXECUTE 'ALTER TABLE public.waste_pickups ENABLE TRIGGER trigger_pickup_completion';
    EXECUTE 'ALTER TABLE public.waste_pickups ENABLE TRIGGER on_pickup_status_change';
    EXECUTE 'ALTER TABLE public.waste_pickups ENABLE TRIGGER on_pickup_completion_process_referral';
    EXECUTE 'ALTER TABLE public.waste_pickups ENABLE TRIGGER on_pickup_referral_check';
    EXECUTE 'ALTER TABLE public.issue_reports ENABLE TRIGGER on_issue_report_created';
    EXECUTE 'ALTER TABLE public.issue_reports ENABLE TRIGGER on_issue_resolved';
  ELSE
    EXECUTE 'ALTER TABLE public.waste_pickups DISABLE TRIGGER trigger_pickup_completion';
    EXECUTE 'ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_status_change';
    EXECUTE 'ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_completion_process_referral';
    EXECUTE 'ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_referral_check';
    EXECUTE 'ALTER TABLE public.issue_reports DISABLE TRIGGER on_issue_report_created';
    EXECUTE 'ALTER TABLE public.issue_reports DISABLE TRIGGER on_issue_resolved';
  END IF;

  PERFORM log_admin_action(
    CASE WHEN _enabled THEN 'rewards_enabled' ELSE 'rewards_disabled' END,
    jsonb_build_object('enabled', _enabled)
  );
END;
$$;

-- Reset all rewards
CREATE OR REPLACE FUNCTION public.admin_reset_all_rewards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users_affected int;
  v_tx_deleted int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset rewards';
  END IF;

  WITH d AS (DELETE FROM public.reward_transactions RETURNING 1)
  SELECT COUNT(*) INTO v_tx_deleted FROM d;

  WITH u AS (
    UPDATE public.rewards
    SET points = 0, total_earned = 0, total_redeemed = 0, updated_at = now()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_users_affected FROM u;

  UPDATE public.user_streaks
  SET current_streak = 0, longest_streak = 0, last_activity_date = NULL, updated_at = now();

  UPDATE public.user_referrals
  SET status = 'pending', completed_at = NULL, points_awarded = 0, updated_at = now()
  WHERE status = 'completed';

  PERFORM log_admin_action(
    'rewards_reset',
    jsonb_build_object(
      'users_affected', v_users_affected,
      'transactions_deleted', v_tx_deleted
    )
  );
END;
$$;

-- Reset all pickups
CREATE OR REPLACE FUNCTION public.admin_reset_all_pickups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can reset pickups';
  END IF;

  WITH d AS (DELETE FROM public.waste_pickups RETURNING 1)
  SELECT COUNT(*) INTO v_deleted FROM d;

  PERFORM log_admin_action(
    'pickups_reset',
    jsonb_build_object('pickups_deleted', v_deleted)
  );
END;
$$;