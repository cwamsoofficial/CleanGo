-- Update storage policies to allow collectors to view all issue images
DROP POLICY IF EXISTS "Collectors can view images from assigned reports" ON storage.objects;

CREATE POLICY "Collectors can view all issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images' 
  AND (
    has_role(auth.uid(), 'collector') 
    OR has_role(auth.uid(), 'admin')
    OR auth.uid() IN (
      SELECT reporter_id 
      FROM public.issue_reports 
      WHERE image_url = storage.objects.name
    )
  )
);

-- Create function to award points when issue is resolved
CREATE OR REPLACE FUNCTION public.handle_issue_resolution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process when status changes to 'resolved'
  IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
    -- Award 2.5 points (half of pickup points) to the assigned collector
    IF NEW.assigned_collector_id IS NOT NULL THEN
      -- Since we can't store 2.5 points directly, we'll use 3 points (rounded up)
      -- Or we could alternate between 2 and 3 points
      PERFORM award_points(NEW.assigned_collector_id, 3, 'Issue resolution');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for issue resolution
DROP TRIGGER IF EXISTS on_issue_resolved ON public.issue_reports;
CREATE TRIGGER on_issue_resolved
  AFTER UPDATE ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_issue_resolution();