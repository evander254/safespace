-- Migration for commissions and split payments
-- Created: 2026-05-10

-- 1. Create Commissions Table
CREATE TABLE IF NOT EXISTS public.commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
    therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
    client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount numeric(10,2) NOT NULL,
    commission_percentage numeric(5,2) DEFAULT 15.00,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Admins can view commissions" ON public.commissions;
CREATE POLICY "Admins can view commissions" ON public.commissions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. Update the handle_booking_approval function to handle split states
-- Status: confirmed -> Deduct Client
-- Status: completed -> Payout Therapist & Record Commission
-- Status: cancelled -> Refund Client (if it was confirmed)
CREATE OR REPLACE FUNCTION public.handle_booking_payment_flow()
RETURNS trigger AS $$
DECLARE
  session_price numeric;
  user_balance numeric;
  therapist_name text;
  therapist_share numeric;
  admin_share numeric;
BEGIN
  -- A. HANDLE CONFIRMATION (Deduct Client)
  IF (NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
    -- Get session price and therapist name
    SELECT price_per_session, full_name INTO session_price, therapist_name FROM public.therapists WHERE id = NEW.therapist_id;
    
    -- Get wallet info for client
    SELECT balance INTO user_balance FROM public.wallets WHERE user_id = NEW.client_id;
    
    -- Check balance
    IF user_balance < session_price THEN
      RAISE EXCEPTION 'Insufficient wallet balance (KSh %) to approve booking (Price: KSh %).', user_balance, session_price;
    END IF;
    
    -- Deduct full price from client wallet
    UPDATE public.wallets 
    SET balance = balance - session_price, 
        updated_at = now() 
    WHERE user_id = NEW.client_id;
    
    -- Record client transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    SELECT id, -session_price, 'payment', 'Payment for session with ' || therapist_name || ' (Held until completion)'
    FROM public.wallets WHERE user_id = NEW.client_id;

  -- B. HANDLE COMPLETION (Payout Therapist & Commission)
  ELSIF (NEW.status = 'completed' AND OLD.status = 'confirmed') THEN
    -- Get session price
    SELECT price_per_session INTO session_price FROM public.therapists WHERE id = NEW.therapist_id;
    
    -- Calculate shares (85% for therapist, 15% for admin)
    therapist_share := session_price * 0.85;
    admin_share := session_price * 0.15;

    -- Credit therapist wallet
    UPDATE public.wallets
    SET balance = balance + therapist_share,
        updated_at = now()
    WHERE user_id = NEW.therapist_id;

    -- Record therapist transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    SELECT id, therapist_share, 'deposit', 'Session fee earned (85% share) - Session Completed'
    FROM public.wallets WHERE user_id = NEW.therapist_id;

    -- Record admin commission
    INSERT INTO public.commissions (booking_id, therapist_id, client_id, amount, commission_percentage)
    VALUES (NEW.id, NEW.therapist_id, NEW.client_id, admin_share, 15.00);

  -- C. HANDLE CANCELLATION (Refund Client)
  ELSIF (NEW.status = 'cancelled' AND OLD.status = 'confirmed') THEN
    -- Get session price
    SELECT price_per_session INTO session_price FROM public.therapists WHERE id = NEW.therapist_id;
    
    -- Refund client wallet
    UPDATE public.wallets 
    SET balance = balance + session_price, 
        updated_at = now() 
    WHERE user_id = NEW.client_id;
    
    -- Record refund transaction
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, description)
    SELECT id, session_price, 'refund', 'Refund for cancelled session'
    FROM public.wallets WHERE user_id = NEW.client_id;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-link the trigger
DROP TRIGGER IF EXISTS trg_booking_approval ON public.bookings;
CREATE TRIGGER trg_booking_payment_flow
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_payment_flow();
