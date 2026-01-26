-- Fix 1: Restrict collectors to only view images from assigned or unassigned pending issues
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Collectors can view all issue images" ON storage.objects;

-- Create a more restrictive policy that limits collectors to:
-- 1. Images from issues assigned to them
-- 2. Images from unassigned pending issues (so they can preview before accepting)
CREATE POLICY "Collectors can view assigned and unassigned pending issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images' 
  AND (
    -- Admins can view all
    has_role(auth.uid(), 'admin')
    -- Users can view their own uploads
    OR auth.uid()::text = (storage.foldername(name))[1]
    -- Collectors can only view images from their assigned issues or unassigned pending issues
    OR (
      has_role(auth.uid(), 'collector') AND
      EXISTS (
        SELECT 1 FROM public.issue_reports ir
        WHERE ir.image_url LIKE '%' || storage.objects.name || '%'
          AND (
            ir.assigned_collector_id = auth.uid()
            OR (ir.assigned_collector_id IS NULL AND ir.status = 'pending'::issue_status)
          )
      )
    )
  )
);

-- Fix 2: Add server-side validation constraints to waste_pickups table
-- These match the constraints already on issue_reports for consistency

-- Add location length constraint (max 500 characters)
ALTER TABLE public.waste_pickups
ADD CONSTRAINT check_pickup_location_length 
  CHECK (location IS NULL OR LENGTH(location) <= 500);

-- Add notes length constraint (max 2000 characters)
ALTER TABLE public.waste_pickups
ADD CONSTRAINT check_pickup_notes_length 
  CHECK (notes IS NULL OR LENGTH(notes) <= 2000);

-- Add scheduled_date validation using a trigger (CHECK constraints can't use mutable functions like CURRENT_DATE)
CREATE OR REPLACE FUNCTION public.validate_pickup_scheduled_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate on INSERT or when scheduled_date is being updated
  IF (TG_OP = 'INSERT' OR OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date) THEN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Scheduled date cannot be in the past';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for scheduled_date validation
DROP TRIGGER IF EXISTS validate_pickup_scheduled_date_trigger ON public.waste_pickups;
CREATE TRIGGER validate_pickup_scheduled_date_trigger
BEFORE INSERT OR UPDATE ON public.waste_pickups
FOR EACH ROW
EXECUTE FUNCTION public.validate_pickup_scheduled_date();