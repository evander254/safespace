-- Migration to add top-up stats to admin dashboard and fix admin access
-- Created: 2026-05-11

-- 1. Update get_admin_dashboard_stats to include top-up summary
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
    topup_stats jsonb;
    new_users_week int;
    new_therapists_week int;
    weekly_commissions numeric;
    recent_pending_therapists jsonb;
    non_approved_therapists jsonb;
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

    -- 3b. Top-up stats
    SELECT jsonb_build_object(
        'pending_count', count(*) FILTER (WHERE status = 'pending'),
        'pending_amount', coalesce(sum(amount) FILTER (WHERE status = 'pending'), 0),
        'approved_today_count', count(*) FILTER (WHERE status = 'approved' AND created_at >= current_date),
        'total_approved_amount', coalesce(sum(amount) FILTER (WHERE status = 'approved'), 0)
    ) INTO topup_stats FROM public.topup_requests;
    
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
    
    SELECT jsonb_agg(t) INTO non_approved_therapists FROM (
        SELECT * FROM public.therapists 
        WHERE is_approved = false 
        ORDER BY created_at DESC LIMIT 10
    ) t;

    -- Build final result
    result := jsonb_build_object(
        'user_count', user_count,
        'therapist_count', therapist_count,
        'approved_therapists', approved_count,
        'total_commissions', total_commissions,
        'booking_stats', booking_stats,
        'topup_stats', topup_stats,
        'new_users_week', new_users_week,
        'new_therapists_week', new_therapists_week,
        'weekly_commissions', weekly_commissions,
        'recent_pending_therapists', coalesce(recent_pending_therapists, '[]'::jsonb),
        'non_approved_therapists', coalesce(non_approved_therapists, '[]'::jsonb)
    );
    
    RETURN result;
END;
$$;

-- 2. Add an RPC to ensure admin role for the current user (helpful for development)
CREATE OR REPLACE FUNCTION public.make_me_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.make_me_admin() TO authenticated;
