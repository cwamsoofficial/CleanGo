-- Allow collectors to directly accept/update unassigned pending pickups (revert to automatic acceptance)
DROP POLICY IF EXISTS "Collectors can accept unassigned pending pickups" ON public.waste_pickups;

CREATE POLICY "Collectors can accept unassigned pending pickups" 
ON public.waste_pickups 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'collector'::app_role) 
  AND collector_id IS NULL 
  AND status = 'pending'::pickup_status
)
WITH CHECK (
  has_role(auth.uid(), 'collector'::app_role)
);