-- Create trigger to handle pickup completion and award points
CREATE TRIGGER on_pickup_status_change
  AFTER INSERT OR UPDATE ON public.waste_pickups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pickup_completion();

-- Create trigger to handle referral completion
CREATE TRIGGER on_pickup_referral_check
  AFTER INSERT OR UPDATE ON public.waste_pickups
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_completion();