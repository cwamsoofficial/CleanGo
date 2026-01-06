-- Allow collectors to delete their own pending pickup requests
CREATE POLICY "Collectors can delete their own pending pickup requests"
ON public.pickup_requests
FOR DELETE
USING (auth.uid() = collector_id AND status = 'pending');