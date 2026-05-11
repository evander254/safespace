-- Migration for top-up requests
-- Created: 2026-05-11

-- 1. Create Top-up Status Enum
DO $$ BEGIN
    CREATE TYPE public.topup_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Top-up Requests Table
CREATE TABLE IF NOT EXISTS public.topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL, -- e.g. 'M-Pesa', 'Bank Transfer', 'Card'
  reference_code text, -- e.g. M-Pesa transaction code
  status public.topup_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Users can view own topup requests" ON public.topup_requests;
CREATE POLICY "Users can view own topup requests" ON public.topup_requests 
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own topup requests" ON public.topup_requests;
CREATE POLICY "Users can create own topup requests" ON public.topup_requests 
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all topup requests" ON public.topup_requests;
CREATE POLICY "Admins can view all topup requests" ON public.topup_requests 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update topup requests" ON public.topup_requests;
CREATE POLICY "Admins can update topup requests" ON public.topup_requests 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 5. Trigger function to handle balance update on approval
CREATE OR REPLACE FUNCTION public.handle_topup_approval()
RETURNS trigger AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  -- If status changed to approved
  IF (NEW.status = 'approved' AND OLD.status = 'pending') THEN
    -- Get user's wallet
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.user_id;
    
    -- Update wallet balance
    UPDATE public.wallets 
    SET balance = balance + NEW.amount, 
        updated_at = now() 
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    VALUES (v_wallet_id, NEW.amount, 'deposit', 'Top-up approved: ' || NEW.method || ' (Ref: ' || COALESCE(NEW.reference_code, 'N/A') || ')');
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger
DROP TRIGGER IF EXISTS trg_topup_approval ON public.topup_requests;
CREATE TRIGGER trg_topup_approval
  AFTER UPDATE ON public.topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_topup_approval();

-- 7. Add updated_at trigger
DROP TRIGGER IF EXISTS trg_topup_requests_updated ON public.topup_requests;
CREATE TRIGGER trg_topup_requests_updated 
  BEFORE UPDATE ON public.topup_requests 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
