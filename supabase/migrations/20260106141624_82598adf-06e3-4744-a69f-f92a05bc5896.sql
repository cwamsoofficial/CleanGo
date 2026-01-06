-- Allow collectors to view unassigned pending issues (so they can request them)
CREATE POLICY "Collectors can view unassigned pending issues"
ON public.issue_reports
FOR SELECT
USING (
  has_role(auth.uid(), 'collector') 
  AND assigned_collector_id IS NULL 
  AND status = 'pending'::issue_status
);

-- Allow collectors to view unassigned pending pickups (so they can request them)
CREATE POLICY "Collectors can view unassigned pending pickups"
ON public.waste_pickups
FOR SELECT
USING (
  has_role(auth.uid(), 'collector') 
  AND collector_id IS NULL 
  AND status = 'pending'::pickup_status
);