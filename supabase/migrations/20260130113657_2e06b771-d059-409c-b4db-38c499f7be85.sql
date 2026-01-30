-- Create secure function to get the authenticated user's own profile
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS TABLE(
  id uuid,
  name text,
  phone text,
  address text,
  avatar_url text,
  referral_code text,
  banned boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.phone,
    p.address,
    p.avatar_url,
    p.referral_code,
    p.banned,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = auth.uid()
  AND NOT p.banned;
$$;