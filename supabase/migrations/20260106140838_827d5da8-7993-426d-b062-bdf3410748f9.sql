-- Allow authenticated users to view profiles (needed for displaying names in pickups, issues, leaderboard)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);