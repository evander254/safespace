-- Migration for fetching all bookings for admin
-- Created: 2026-05-10

CREATE OR REPLACE FUNCTION public.get_all_bookings_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(b) INTO result FROM (
        SELECT 
            bk.*,
            jsonb_build_object(
                'id', t.id,
                'full_name', t.full_name,
                'avatar_url', t.avatar_url,
                'price_per_session', t.price_per_session
            ) as therapist,
            jsonb_build_object(
                'id', p.id,
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            ) as client
        FROM public.bookings bk
        LEFT JOIN public.therapists t ON bk.therapist_id = t.id
        LEFT JOIN public.profiles p ON bk.client_id = p.id
        ORDER BY bk.created_at DESC
    ) b;
    
    RETURN coalesce(result, '[]'::jsonb);
END;
$$;
