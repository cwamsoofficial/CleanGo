-- Allow collectors to directly accept/update unassigned pending issues (revert to automatic acceptance)
DROP POLICY IF EXISTS "Collectors can accept unassigned pending issues" ON public.issue_reports;

CREATE POLICY "Collectors can accept unassigned pending issues" 
ON public.issue_reports 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'collector'::app_role) 
  AND assigned_collector_id IS NULL 
  AND status = 'pending'::issue_status
)
WITH CHECK (
  has_role(auth.uid(), 'collector'::app_role)
);