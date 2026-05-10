-- Allow therapists to see the profile info (name, phone, email) of clients who have booked sessions with them
-- This is required because 'profiles' RLS previously only allowed self-selection or admin access.

CREATE POLICY "therapists can see profiles of booked clients"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.client_id = public.profiles.id
      AND b.therapist_id = auth.uid()
    )
  );
