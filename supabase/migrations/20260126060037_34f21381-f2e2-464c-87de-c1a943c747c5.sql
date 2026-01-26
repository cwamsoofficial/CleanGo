-- Drop unused request/approval workflow functions
-- These are no longer needed since collectors now directly accept pickups and issues

DROP FUNCTION IF EXISTS public.approve_pickup_request(uuid);
DROP FUNCTION IF EXISTS public.reject_pickup_request(uuid, text);
DROP FUNCTION IF EXISTS public.approve_issue_request(uuid);
DROP FUNCTION IF EXISTS public.reject_issue_request(uuid, text);