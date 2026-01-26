-- Create a secure function to get pickup requester names
-- This allows collectors to see names for unassigned pending pickups without exposing full profile data
CREATE OR REPLACE FUNCTION public.get_pickup_requester_names(pickup_ids uuid[])
RETURNS TABLE (pickup_id uuid, user_name text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT wp.id as pickup_id, p.name as user_name
  FROM waste_pickups wp
  JOIN profiles p ON p.id = wp.user_id
  WHERE wp.id = ANY(pickup_ids)
  AND (
    -- User owns the pickup
    auth.uid() = wp.user_id
    -- Collector is assigned to the pickup  
    OR auth.uid() = wp.collector_id
    -- Collector viewing unassigned pending pickup
    OR (has_role(auth.uid(), 'collector') AND wp.collector_id IS NULL AND wp.status = 'pending')
    -- Admin can see all
    OR has_role(auth.uid(), 'admin')
  );
$$;