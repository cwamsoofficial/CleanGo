-- Create issue_requests table for collector assignment requests
CREATE TABLE public.issue_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id UUID NOT NULL REFERENCES public.issue_reports(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issue_requests ENABLE ROW LEVEL SECURITY;

-- Collectors can view their own requests
CREATE POLICY "Collectors can view their own issue requests"
ON public.issue_requests
FOR SELECT
USING (auth.uid() = collector_id);

-- Collectors can create requests for unassigned pending issues
CREATE POLICY "Collectors can create issue requests"
ON public.issue_requests
FOR INSERT
WITH CHECK (
  auth.uid() = collector_id AND
  EXISTS (
    SELECT 1 FROM issue_reports
    WHERE issue_reports.id = issue_requests.issue_id
    AND issue_reports.assigned_collector_id IS NULL
    AND issue_reports.status = 'pending'
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all issue requests"
ON public.issue_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update issue requests"
ON public.issue_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete issue requests"
ON public.issue_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Function to approve issue request
CREATE OR REPLACE FUNCTION public.approve_issue_request(_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _issue_id UUID;
  _collector_id UUID;
BEGIN
  -- Get request details
  SELECT issue_id, collector_id INTO _issue_id, _collector_id
  FROM issue_requests
  WHERE id = _request_id AND status = 'pending';
  
  IF _issue_id IS NULL THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Update the issue to assign the collector
  UPDATE issue_reports
  SET assigned_collector_id = _collector_id, updated_at = now()
  WHERE id = _issue_id;
  
  -- Update the request status
  UPDATE issue_requests
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE id = _request_id;
  
  -- Reject other pending requests for the same issue
  UPDATE issue_requests
  SET status = 'rejected', admin_notes = 'Another request was approved', reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE issue_id = _issue_id AND id != _request_id AND status = 'pending';
END;
$$;

-- Function to reject issue request
CREATE OR REPLACE FUNCTION public.reject_issue_request(_request_id UUID, _reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE issue_requests
  SET status = 'rejected', admin_notes = _reason, reviewed_at = now(), reviewed_by = auth.uid(), updated_at = now()
  WHERE id = _request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
END;
$$;