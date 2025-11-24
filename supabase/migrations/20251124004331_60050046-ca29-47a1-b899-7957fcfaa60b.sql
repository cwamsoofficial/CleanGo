-- Create private storage bucket for issue report images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-images',
  'issue-images',
  false,  -- Private bucket
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'issue-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own uploaded images
CREATE POLICY "Users can view their own issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Collectors can view images from reports assigned to them
CREATE POLICY "Collectors can view assigned report images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  (
    -- Check if user is a collector viewing reports assigned to them
    EXISTS (
      SELECT 1
      FROM public.issue_reports ir
      WHERE ir.image_url LIKE '%' || name || '%'
        AND ir.assigned_collector_id = auth.uid()
    )
    OR
    -- Check if user has collector role
    public.has_role(auth.uid(), 'collector'::app_role)
  )
);

-- Policy: Admins can view all issue images
CREATE POLICY "Admins can view all issue images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Users can update their own images (if needed to replace)
CREATE POLICY "Users can update their own issue images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own issue images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can delete any issue images
CREATE POLICY "Admins can delete issue images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'issue-images' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);