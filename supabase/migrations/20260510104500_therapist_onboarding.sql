-- ============ THERAPIST ONBOARDING UPDATES ============

-- 1. Extend Therapists Table
ALTER TABLE public.therapists 
  ADD COLUMN IF NOT EXISTS license_type TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS malpractice_insurance_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS modalities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excluded_populations TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lived_experience TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faith_based_integration BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS engagement_style_directive INT DEFAULT 3, -- 1-5 scale
  ADD COLUMN IF NOT EXISTS engagement_style_formal INT DEFAULT 3, -- 1-5 scale
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT,
  ADD COLUMN IF NOT EXISTS accepts_insurance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS insurance_plans TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sliding_scale BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS session_types TEXT[] DEFAULT '{}', -- video, in-person, text
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Update handle_new_user trigger to support roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role public.app_role;
BEGIN
  -- Determine role from metadata, default to 'client'
  target_role := COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'client');

  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone'
  );

  -- Assign Role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (new.id, target_role) 
  ON CONFLICT (user_id, role) DO NOTHING;

  -- If therapist, initialize therapist entry
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
