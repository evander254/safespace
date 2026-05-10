-- Fix the relation between bookings and profiles to allow easier joins
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_client_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Ensure therapist_id also references profiles if needed, though it already references therapists table which references users
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_therapist_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_therapist_id_fkey
FOREIGN KEY (therapist_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
