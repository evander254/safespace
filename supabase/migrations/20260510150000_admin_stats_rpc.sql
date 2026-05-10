-- Migration for admin dashboard statistics
-- Created: 2026-05-10

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    user_count int;
    therapist_count int;
    approved_count int;
    total_commissions numeric;
    booking_stats jsonb;
    new_users_week int;
    new_therapists_week int;
    weekly_commissions numeric;
    recent_pending_therapists jsonb;
    recent_clients jsonb;
BEGIN
    -- 1. General counts
    SELECT count(*) INTO user_count FROM public.profiles;
    SELECT count(*) INTO therapist_count FROM public.therapists;
    SELECT count(*) INTO approved_count FROM public.therapists WHERE is_approved = true;
    
    -- 2. Commissions
    SELECT coalesce(sum(amount), 0) INTO total_commissions FROM public.commissions;
    
    -- 3. Booking stats
    SELECT jsonb_build_object(
        'total', count(*),
        'completed', count(*) FILTER (WHERE status = 'completed'),
        'confirmed', count(*) FILTER (WHERE status = 'confirmed'),
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled')
    ) INTO booking_stats FROM public.bookings;
    
    -- 4. Weekly growth
    SELECT count(*) INTO new_users_week FROM public.profiles WHERE created_at > now() - interval '7 days';
    SELECT count(*) INTO new_therapists_week FROM public.therapists WHERE created_at > now() - interval '7 days';
    SELECT coalesce(sum(amount), 0) INTO weekly_commissions FROM public.commissions WHERE created_at > now() - interval '7 days';
    
    -- 5. Recent Lists
    SELECT jsonb_agg(t) INTO recent_pending_therapists FROM (
        SELECT * FROM public.therapists 
        WHERE onboarding_completed = true AND is_approved = false 
        ORDER BY created_at DESC LIMIT 5
    ) t;
    
    SELECT jsonb_agg(p) INTO recent_clients FROM (
        SELECT * FROM public.profiles 
        ORDER BY created_at DESC LIMIT 5
    ) p;

    -- Build final result
    result := jsonb_build_object(
        'user_count', user_count,
        'therapist_count', therapist_count,
        'approved_therapists', approved_count,
        'total_commissions', total_commissions,
        'booking_stats', booking_stats,
        'new_users_week', new_users_week,
        'new_therapists_week', new_therapists_week,
        'weekly_commissions', weekly_commissions,
        'recent_pending_therapists', coalesce(recent_pending_therapists, '[]'::jsonb),
        'recent_clients', coalesce(recent_clients, '[]'::jsonb)
    );
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_commissions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(c) INTO result FROM (
        SELECT 
            com.*,
            jsonb_build_object('full_name', t.full_name) as therapist,
            jsonb_build_object('full_name', p.full_name) as client
        FROM public.commissions com
        LEFT JOIN public.therapists t ON com.therapist_id = t.id
        LEFT JOIN public.profiles p ON com.client_id = p.id
        ORDER BY com.created_at DESC
    ) c;
    
    RETURN coalesce(result, '[]'::jsonb);
END;
$$;
