-- Migration for saved payment methods
-- Created: 2026-05-11

-- 1. Create Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'M-Pesa', 'Card', 'Bank'
  nickname text, -- e.g. 'My Personal M-Pesa'
  details jsonb NOT NULL DEFAULT '{}'::jsonb, -- Store phone number, masked card, etc.
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Add updated_at trigger
DROP TRIGGER IF EXISTS trg_payment_methods_updated ON public.payment_methods;
CREATE TRIGGER trg_payment_methods_updated 
  BEFORE UPDATE ON public.payment_methods 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Function to ensure only one default method per user
CREATE OR REPLACE FUNCTION public.handle_default_payment_method()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_default_payment_method
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_default_payment_method();
