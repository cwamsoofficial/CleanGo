-- Add category and geolocation to issue_reports for SafeWaste module
ALTER TABLE public.issue_reports
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Validate category values via trigger (kept flexible for future categories)
CREATE OR REPLACE FUNCTION public.validate_issue_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.category IS NOT NULL AND NEW.category NOT IN (
    'overflowing_bin','illegal_dumping','missed_pickup','hazardous_waste','recycling','street_litter','other'
  ) THEN
    RAISE EXCEPTION 'Invalid issue category: %', NEW.category;
  END IF;
  IF NEW.latitude IS NOT NULL AND (NEW.latitude < -90 OR NEW.latitude > 90) THEN
    RAISE EXCEPTION 'Latitude out of range';
  END IF;
  IF NEW.longitude IS NOT NULL AND (NEW.longitude < -180 OR NEW.longitude > 180) THEN
    RAISE EXCEPTION 'Longitude out of range';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_issue_report_trigger ON public.issue_reports;
CREATE TRIGGER validate_issue_report_trigger
BEFORE INSERT OR UPDATE ON public.issue_reports
FOR EACH ROW EXECUTE FUNCTION public.validate_issue_report();

-- Public, anonymized view for the live waste map (no PII)
CREATE OR REPLACE FUNCTION public.get_waste_map_data()
RETURNS TABLE (
  id uuid,
  category text,
  status issue_status,
  latitude double precision,
  longitude double precision,
  location text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, category, status, latitude, longitude, location, created_at
  FROM public.issue_reports
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
$$;

-- Aggregated dashboard insights (no PII)
CREATE OR REPLACE FUNCTION public.get_waste_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_pending int;
  v_in_progress int;
  v_resolved int;
  v_last_7_days int;
  v_by_category json;
  v_top_locations json;
  v_trend json;
BEGIN
  SELECT COUNT(*) INTO v_total FROM issue_reports;
  SELECT COUNT(*) INTO v_pending FROM issue_reports WHERE status = 'pending';
  SELECT COUNT(*) INTO v_in_progress FROM issue_reports WHERE status = 'in_progress';
  SELECT COUNT(*) INTO v_resolved FROM issue_reports WHERE status = 'resolved';
  SELECT COUNT(*) INTO v_last_7_days FROM issue_reports WHERE created_at > NOW() - INTERVAL '7 days';

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_by_category FROM (
    SELECT COALESCE(category,'uncategorized') AS category, COUNT(*)::int AS count
    FROM issue_reports
    GROUP BY COALESCE(category,'uncategorized')
    ORDER BY count DESC
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_top_locations FROM (
    SELECT location, COUNT(*)::int AS count
    FROM issue_reports
    WHERE location IS NOT NULL AND location <> ''
    GROUP BY location
    ORDER BY count DESC
    LIMIT 5
  ) t;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.day), '[]'::json) INTO v_trend FROM (
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
    FROM issue_reports
    WHERE created_at > NOW() - INTERVAL '14 days'
    GROUP BY date_trunc('day', created_at)
  ) t;

  RETURN json_build_object(
    'total', v_total,
    'pending', v_pending,
    'in_progress', v_in_progress,
    'resolved', v_resolved,
    'last_7_days', v_last_7_days,
    'by_category', v_by_category,
    'top_locations', v_top_locations,
    'trend', v_trend
  );
END;
$$;