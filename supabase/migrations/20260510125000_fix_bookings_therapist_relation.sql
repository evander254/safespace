-- Restoring the therapists foreign key to allow the UI to join correctly
-- This ensures that querying therapists(full_name, price_per_session) from bookings works

ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_therapist_id_fkey;

-- Restore relation to therapists table
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_therapist_id_therapists_fkey 
FOREIGN KEY (therapist_id) 
REFERENCES public.therapists(id) 
ON DELETE CASCADE;

-- Also ensure client_id relation is named clearly
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_client_id_profiles_fkey
FOREIGN KEY (client_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
