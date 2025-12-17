-- Allow citizens to update their own pending reports
CREATE POLICY "Users can update their own pending reports"
ON public.issue_reports
FOR UPDATE
USING (auth.uid() = reporter_id AND status = 'pending')
WITH CHECK (auth.uid() = reporter_id AND status = 'pending');

-- Allow admins to delete any report
CREATE POLICY "Admins can delete reports"
ON public.issue_reports
FOR DELETE
USING (has_role(auth.uid(), 'admin'));