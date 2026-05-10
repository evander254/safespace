-- ============ CLIENT INTAKE TABLE ============
-- Stores all onboarding wizard responses per patient

CREATE TABLE public.client_intake (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Presenting Concerns
  primary_concerns       text[]   NOT NULL DEFAULT '{}',
  concern_trigger        text,
  affected_areas         text[]   NOT NULL DEFAULT '{}',
  therapy_goals          text[]   NOT NULL DEFAULT '{}',
  goals_detail           text,

  -- Step 2: Identity & Culture
  gender                 text,
  ethnicity              text,
  religion               text,
  identity_match_importance int NOT NULL DEFAULT 3,

  -- Step 3: Communication Style
  therapeutic_style      text,
  therapy_approach       text,
  communication_notes    text,

  -- Step 4: Practical Details
  availability           text[]   NOT NULL DEFAULT '{}',
  budget_range           text,
  insurance_provider     text,
  preferred_channel      text,

  -- Step 5: Safety & History
  previous_therapy          text,
  previous_therapy_feedback text,
  current_safety            text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update timestamp
CREATE TRIGGER trg_client_intake_updated
  BEFORE UPDATE ON public.client_intake
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ RLS ============
ALTER TABLE public.client_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_intake self select"
  ON public.client_intake FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "client_intake self insert"
  ON public.client_intake FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "client_intake self update"
  ON public.client_intake FOR UPDATE
  USING (user_id = auth.uid());
