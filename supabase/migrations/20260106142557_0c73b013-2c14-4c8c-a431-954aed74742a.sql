-- Fix PUBLIC_DATA_EXPOSURE: Remove the overly broad profiles policy
-- and create a secure leaderboard function instead

-- 1. Remove the overly broad policy that exposes all user PII
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 2. Create a secure leaderboard function that only returns necessary data
-- This replaces direct profile table access for leaderboard functionality
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 100)
RETURNS TABLE (
  user_id uuid,
  name text,
  points integer,
  total_earned integer,
  pickups_completed bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.user_id,
    p.name,
    r.points,
    r.total_earned,
    (SELECT COUNT(*) FROM waste_pickups wp 
     WHERE wp.user_id = r.user_id 
     AND wp.status = 'collected'::pickup_status) as pickups_completed
  FROM rewards r
  JOIN profiles p ON p.id = r.user_id
  WHERE NOT p.banned
  ORDER BY r.points DESC
  LIMIT limit_count;
END;
$$;

-- 3. Create a function to get a single user's public profile for display purposes
-- This allows fetching just the name when needed (e.g., showing pickup requester name)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name
  FROM profiles p
  WHERE p.id = profile_id
  AND NOT p.banned;
$$;

-- 4. Add policy for collectors to view profiles of users they're working with
-- This allows collectors to see names of users whose pickups/issues they handle
CREATE POLICY "Collectors can view profiles of assigned work"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'collector') AND
  (
    EXISTS (
      SELECT 1 FROM waste_pickups 
      WHERE collector_id = auth.uid() AND user_id = profiles.id
    ) 
    OR EXISTS (
      SELECT 1 FROM issue_reports
      WHERE assigned_collector_id = auth.uid() AND reporter_id = profiles.id
    )
  )
);