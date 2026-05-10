-- Wallet system migration
-- Created: 2026-05-10

-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create Transaction Type Enum
DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'payment', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Wallet Transactions Table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  type public.transaction_type NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Wallets self read" ON public.wallets;
CREATE POLICY "Wallets self read" ON public.wallets FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Wallets admin read" ON public.wallets;
CREATE POLICY "Wallets admin read" ON public.wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Transactions self read" ON public.wallet_transactions;
CREATE POLICY "Transactions self read" ON public.wallet_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
);

-- 6. Trigger to create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) 
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 7. Trigger to deduct balance on booking approval
CREATE OR REPLACE FUNCTION public.handle_booking_approval()
RETURNS trigger AS $$
DECLARE
  session_price numeric;
  user_balance numeric;
  therapist_name text;
BEGIN
  -- If status changed to confirmed
  IF (NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
    -- Get session price and therapist name
    SELECT price_per_session, full_name INTO session_price, therapist_name FROM public.therapists WHERE id = NEW.therapist_id;
    
    -- Get wallet info
    SELECT balance INTO user_balance FROM public.wallets WHERE user_id = NEW.client_id;
    
    -- Check balance
    IF user_balance < session_price THEN
      RAISE EXCEPTION 'Insufficient wallet balance (KSh %) to approve booking (Price: KSh %).', user_balance, session_price;
    END IF;
    
    -- Deduct from wallet
    UPDATE public.wallets 
    SET balance = balance - session_price, 
        updated_at = now() 
    WHERE user_id = NEW.client_id;
    
    -- Record transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    SELECT id, -session_price, 'payment', 'Payment for session with ' || therapist_name
    FROM public.wallets WHERE user_id = NEW.client_id;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_booking_approval ON public.bookings;
CREATE TRIGGER trg_booking_approval
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_approval();

-- 8. Backfill wallets for existing users
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 9. Add updated_at trigger to wallets
DROP TRIGGER IF EXISTS trg_wallets_updated ON public.wallets;
CREATE TRIGGER trg_wallets_updated 
  BEFORE UPDATE ON public.wallets 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
