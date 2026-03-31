
-- Function to create a notification for a collector when assigned a pickup
CREATE OR REPLACE FUNCTION public.notify_collector_pickup_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when collector_id changes from NULL to a value
  IF NEW.collector_id IS NOT NULL AND (OLD.collector_id IS NULL OR OLD.collector_id != NEW.collector_id) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.collector_id,
      'New Pickup Assigned',
      COALESCE('Pickup at ' || NEW.location, 'A new pickup has been assigned to you'),
      '/dashboard/pickups'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Function to create a notification for a collector when assigned an issue
CREATE OR REPLACE FUNCTION public.notify_collector_issue_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_collector_id IS NOT NULL AND (OLD.assigned_collector_id IS NULL OR OLD.assigned_collector_id != NEW.assigned_collector_id) THEN
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.assigned_collector_id,
      'New Issue Assigned',
      COALESCE(NEW.title || ' - ' || NEW.location, 'A new issue has been assigned to you'),
      '/dashboard/issues'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create triggers
CREATE TRIGGER on_pickup_collector_assigned
  AFTER UPDATE ON public.waste_pickups
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collector_pickup_assigned();

CREATE TRIGGER on_issue_collector_assigned
  AFTER UPDATE ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_collector_issue_assigned();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
