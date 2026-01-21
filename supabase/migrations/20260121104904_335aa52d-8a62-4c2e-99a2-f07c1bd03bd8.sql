-- Drop the overly permissive policy that exposes all user profiles to any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Note: The following secure policies already exist and remain in place:
-- - "Users can view their own profile" 
-- - "Admins can view all profiles"
-- - "Collectors can view profiles of assigned work"
-- - Secure get_leaderboard() function returns only names (not PII)
-- - Secure get_public_profile() function returns only id and name