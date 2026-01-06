-- Allow collectors to delete their own pending requests
CREATE POLICY "Collectors can delete their own pending issue requests"
ON public.issue_requests
FOR DELETE
USING (auth.uid() = collector_id AND status = 'pending');