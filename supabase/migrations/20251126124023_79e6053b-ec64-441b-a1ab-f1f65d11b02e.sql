-- Add banned status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false;

-- Add banned_at timestamp for tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Add banned_reason for documentation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Function to ban a user (admin only)
CREATE OR REPLACE FUNCTION public.ban_user(
  _user_id UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can ban users
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  -- Update profile to banned status
  UPDATE public.profiles
  SET 
    banned = true,
    banned_at = now(),
    banned_reason = _reason
  WHERE id = _user_id;
END;
$$;

-- Function to unban a user (admin only)
CREATE OR REPLACE FUNCTION public.unban_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can unban users
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;

  -- Update profile to unbanned status
  UPDATE public.profiles
  SET 
    banned = false,
    banned_at = NULL,
    banned_reason = NULL
  WHERE id = _user_id;
END;
$$;

-- Function to delete a user and all their data (admin only)
CREATE OR REPLACE FUNCTION public.delete_user_account(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can delete users
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Prevent admins from deleting themselves
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account';
  END IF;

  -- Delete all user data in order (respecting dependencies)
  DELETE FROM public.user_referrals WHERE referrer_id = _user_id OR referred_user_id = _user_id;
  DELETE FROM public.user_streaks WHERE user_id = _user_id;
  DELETE FROM public.reward_transactions WHERE user_id = _user_id;
  DELETE FROM public.rewards WHERE user_id = _user_id;
  DELETE FROM public.waste_pickups WHERE user_id = _user_id OR collector_id = _user_id;
  DELETE FROM public.issue_reports WHERE reporter_id = _user_id OR assigned_collector_id = _user_id;
  DELETE FROM public.notifications WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  
  -- Delete from auth.users (this cascades to remaining tables)
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Add RLS policy to allow admins to update banned status
CREATE POLICY "Admins can update banned status" ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add check to prevent banned users from logging in (handled in app logic)
COMMENT ON COLUMN public.profiles.banned IS 'When true, user account is banned and should not be able to access the system';