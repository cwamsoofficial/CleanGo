-- Drop unused request tables since collectors now directly accept pickups and issues
-- These tables were used for the old request/approval workflow

-- Drop pickup_requests table (RLS policies are automatically removed)
DROP TABLE IF EXISTS public.pickup_requests;

-- Drop issue_requests table (RLS policies are automatically removed)
DROP TABLE IF EXISTS public.issue_requests;