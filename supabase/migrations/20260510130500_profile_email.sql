-- Add email column to profiles to allow therapists and admins to see client contact info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill existing emails from auth.users (requires manual execution or a one-time function if possible)
-- In a real environment, we'd use a script. For this migration, we'll update the handle_new_user function
-- to ensure future signups have it.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'client') ON CONFLICT DO NOTHING;
  RETURN new;
END; $$;
