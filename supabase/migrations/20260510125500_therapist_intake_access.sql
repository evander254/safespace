-- Allow therapists to see the intake data of clients who have booked sessions with them
-- This is critical for clinical evaluation before confirming sessions

CREATE POLICY "therapists can see intake of booked clients"
  ON public.client_intake FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.client_id = public.client_intake.user_id
      AND b.therapist_id = auth.uid()
    )
  );
