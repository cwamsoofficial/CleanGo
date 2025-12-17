-- Drop the existing collector policy
DROP POLICY IF EXISTS "Collectors can view assigned reports" ON public.issue_reports;

-- Create policy for collectors to view their assigned reports
CREATE POLICY "Collectors can view their assigned reports" 
ON public.issue_reports 
FOR SELECT 
USING (
  auth.uid() = assigned_collector_id
);

-- Create policy for collectors to view unassigned reports (available for assignment)
CREATE POLICY "Collectors can view unassigned reports" 
ON public.issue_reports 
FOR SELECT 
USING (
  has_role(auth.uid(), 'collector'::app_role) 
  AND assigned_collector_id IS NULL
);