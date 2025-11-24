-- Create user_referrals table (referral_status enum already exists)
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL,
  referral_code text NOT NULL,
  status referral_status NOT NULL DEFAULT 'pending',
  completed_at timestamp with time zone,
  points_awarded integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Add referral_code to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'referral_code') THEN
    ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Enable RLS
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their referrals as referrer" ON public.user_referrals;
DROP POLICY IF EXISTS "Users can view their referral as referred user" ON public.user_referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.user_referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.user_referrals;

-- RLS Policies for user_referrals
CREATE POLICY "Users can view their referrals as referrer"
ON public.user_referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view their referral as referred user"
ON public.user_referrals
FOR SELECT
USING (auth.uid() = referred_user_id);

CREATE POLICY "Admins can view all referrals"
ON public.user_referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert referrals"
ON public.user_referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_user_id);

CREATE POLICY "System can update referrals"
ON public.user_referrals
FOR UPDATE
USING (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_pickup_completion_process_referral ON public.waste_pickups;

-- Create function to handle referral completion
CREATE OR REPLACE FUNCTION public.process_referral_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referral_record RECORD;
  v_first_pickup boolean;
BEGIN
  -- Only process when status changes to 'collected'
  IF NEW.status = 'collected' AND (OLD.status IS NULL OR OLD.status != 'collected') THEN
    
    -- Check if this is the user's first completed pickup
    SELECT COUNT(*) = 1 INTO v_first_pickup
    FROM public.waste_pickups
    WHERE user_id = NEW.user_id
      AND status = 'collected';
    
    -- If first pickup, check for pending referral
    IF v_first_pickup THEN
      SELECT * INTO v_referral_record
      FROM public.user_referrals
      WHERE referred_user_id = NEW.user_id
        AND status = 'pending'
      FOR UPDATE;
      
      -- If referral exists, award points to referrer
      IF FOUND THEN
        -- Award 100 points to referrer
        PERFORM award_points(v_referral_record.referrer_id, 100, 'Referral bonus - friend completed first pickup');
        
        -- Update referral status
        UPDATE public.user_referrals
        SET 
          status = 'completed',
          completed_at = now(),
          points_awarded = 100,
          updated_at = now()
        WHERE id = v_referral_record.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral completion
CREATE TRIGGER on_pickup_completion_process_referral
AFTER INSERT OR UPDATE ON public.waste_pickups
FOR EACH ROW
EXECUTE FUNCTION public.process_referral_completion();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS generate_referral_code_on_insert ON public.profiles;

-- Function to generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral codes
CREATE TRIGGER generate_referral_code_on_insert
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_referrals_updated_at ON public.user_referrals;

-- Add updated_at trigger for user_referrals
CREATE TRIGGER update_user_referrals_updated_at
BEFORE UPDATE ON public.user_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();