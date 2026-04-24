ALTER TABLE public.waste_pickups DISABLE TRIGGER trigger_pickup_completion;
ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_status_change;
ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_completion_process_referral;
ALTER TABLE public.waste_pickups DISABLE TRIGGER on_pickup_referral_check;
ALTER TABLE public.issue_reports DISABLE TRIGGER on_issue_report_created;
ALTER TABLE public.issue_reports DISABLE TRIGGER on_issue_resolved;