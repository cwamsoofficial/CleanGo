-- Enable realtime for waste_pickups and issue_reports tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_pickups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_reports;