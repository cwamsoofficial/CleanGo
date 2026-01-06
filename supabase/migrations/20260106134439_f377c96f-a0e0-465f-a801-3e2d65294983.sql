-- Create pickup_requests table for collector assignment requests
CREATE TABLE public.pickup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pickup_id UUID NOT NULL REFERENCES public.waste_pickups(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  UNIQUE(pickup_id, collector_id)
);

-- Enable RLS
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- Collectors can view their own requests
CREATE POLICY "Collectors can view their own requests"
ON public.pickup_requests
FOR SELECT
USING (auth.uid() = collector_id);

-- Collectors can create requests for unassigned pickups
CREATE POLICY "Collectors can create requests"
ON public.pickup_requests
FOR INSERT
WITH CHECK (
  auth.uid() = collector_id AND
  EXISTS (
    SELECT 1 FROM public.waste_pickups 
    WHERE id = pickup_id AND collector_id IS NULL AND status = 'pending'
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.pickup_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update requests"
ON public.pickup_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.pickup_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_pickup_requests_updated_at
BEFORE UPDATE ON public.pickup_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve a pickup request
CREATE OR REPLACE FUNCTION public.approve_pickup_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup_id uuid;
  v_collector_id uuid;
BEGIN
  -- Only admins can approve
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve requests';
  END IF;

  -- Get request details
  SELECT pickup_id, collector_id INTO v_pickup_id, v_collector_id
  FROM public.pickup_requests
  WHERE id = _request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Check pickup is still unassigned
  IF EXISTS (SELECT 1 FROM public.waste_pickups WHERE id = v_pickup_id AND collector_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Pickup is already assigned';
  END IF;

  -- Assign the pickup to the collector
  UPDATE public.waste_pickups
  SET collector_id = v_collector_id, status = 'in_progress', updated_at = now()
  WHERE id = v_pickup_id;

  -- Update request status
  UPDATE public.pickup_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = _request_id;

  -- Reject other pending requests for the same pickup
  UPDATE public.pickup_requests
  SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), admin_notes = 'Another collector was assigned'
  WHERE pickup_id = v_pickup_id AND id != _request_id AND status = 'pending';
END;
$$;

-- Function to reject a pickup request
CREATE OR REPLACE FUNCTION public.reject_pickup_request(_request_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can reject
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject requests';
  END IF;

  UPDATE public.pickup_requests
  SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.uid(), admin_notes = _reason
  WHERE id = _request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
END;
$$;