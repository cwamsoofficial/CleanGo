-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update referrals" ON public.user_referrals;

-- Create a restrictive policy that denies direct updates
-- All referral updates must go through SECURITY DEFINER functions
CREATE POLICY "Deny direct referral updates" 
ON public.user_referrals 
FOR UPDATE 
USING (false);