-- ========================================
-- PICKUPS: Collectors can only see assigned pickups
-- ========================================

-- Drop existing collector policies for pickups
DROP POLICY IF EXISTS "Collectors can view assigned pickups" ON public.waste_pickups;

-- Collectors can ONLY view their assigned pickups (not all pickups with collector role)
CREATE POLICY "Collectors can view their assigned pickups"
  ON public.waste_pickups FOR SELECT
  USING (auth.uid() = collector_id);

-- Admins can update pickups (to assign collectors)
DROP POLICY IF EXISTS "Admins can update pickups" ON public.waste_pickups;
CREATE POLICY "Admins can update pickups"
  ON public.waste_pickups FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing collector update policy - collectors should not self-assign
DROP POLICY IF EXISTS "Collectors can update pickups" ON public.waste_pickups;

-- Collectors can only update pickups assigned to them (status, proof image, etc)
CREATE POLICY "Collectors can update their assigned pickups"
  ON public.waste_pickups FOR UPDATE
  USING (auth.uid() = collector_id)
  WITH CHECK (auth.uid() = collector_id);

-- ========================================
-- REPORTS: Collectors can only see assigned reports  
-- ========================================

-- Drop existing collector view policies
DROP POLICY IF EXISTS "Collectors can view their assigned reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Collectors can view assigned reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Collectors can view unassigned reports" ON public.issue_reports;

-- Collectors can ONLY view their assigned reports
CREATE POLICY "Collectors can view their assigned reports"
  ON public.issue_reports FOR SELECT
  USING (auth.uid() = assigned_collector_id);

-- Drop the self-assign policy we just created - collectors cannot self-assign
DROP POLICY IF EXISTS "Collectors can claim unassigned reports" ON public.issue_reports;

-- Keep the policy for collectors to update their assigned reports
-- (Already exists as "Collectors can update assigned reports")

-- Admins can update reports (to assign collectors)
DROP POLICY IF EXISTS "Admins can update reports" ON public.issue_reports;
CREATE POLICY "Admins can update reports"
  ON public.issue_reports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));