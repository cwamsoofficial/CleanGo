-- Fix warn-level security issues

-- 1. NOTIFICATIONS TABLE: Add missing INSERT deny and DELETE policies
-- Explicitly deny user inserts (notifications should only be created by system functions)
CREATE POLICY "Deny direct user inserts to notifications"
ON public.notifications FOR INSERT
WITH CHECK (false);

-- Allow users to delete their own notifications (so they can clear old ones)
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- 2. REWARDS TABLE: Remove the overly broad SELECT policy
-- The get_leaderboard() function already exists and provides secure access
-- Users can still view their own rewards via existing policy
DROP POLICY IF EXISTS "Authenticated users can view all rewards for leaderboard" ON public.rewards;