-- Add policy to allow all authenticated users to view rewards for leaderboard
CREATE POLICY "Authenticated users can view all rewards for leaderboard"
ON public.rewards
FOR SELECT
TO authenticated
USING (true);