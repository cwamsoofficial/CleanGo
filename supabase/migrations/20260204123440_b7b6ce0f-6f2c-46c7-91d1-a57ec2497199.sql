-- Drop the existing SELECT policy and recreate with proper TO clause
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.contact_submissions;

-- Create a proper permissive SELECT policy that only allows admins
CREATE POLICY "Admins can view all contact submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));