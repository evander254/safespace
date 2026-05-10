-- Migration for fetching all therapist applications
-- Created: 2026-05-10

CREATE OR REPLACE FUNCTION public.get_all_applications()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(t) INTO result FROM (
        SELECT * FROM public.therapists 
        WHERE onboarding_completed = true AND is_approved = false 
        ORDER BY created_at DESC
    ) t;
    
    RETURN coalesce(result, '[]'::jsonb);
END;
$$;
