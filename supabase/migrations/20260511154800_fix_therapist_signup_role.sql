-- Final fix for handle_new_user to ensure roles and emails are correctly handled
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role public.app_role;
BEGIN
  -- 1. Determine role from metadata, default to 'client' if not specified
  target_role := COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'client');

  -- 2. Create the base profile (including email for clinical/admin contact)
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    new.email
  );

  -- 3. Assign the correct role (therapist or client)
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (new.id, target_role) 
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. If they are a therapist, initialize their entry in the therapists table
  IF target_role = 'therapist' THEN
    INSERT INTO public.therapists (id, full_name, avatar_url)
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END; $$;
