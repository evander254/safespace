-- Migration for fetching all users and therapists for admin
-- Created: 2026-05-10

CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(u) INTO result FROM (
        SELECT 
            p.*,
            w.balance,
            (SELECT jsonb_agg(r.role) FROM public.user_roles r WHERE r.user_id = p.id) as roles
        FROM public.profiles p
        LEFT JOIN public.wallets w ON p.id = w.user_id
        ORDER BY p.created_at DESC
    ) u;
    
    RETURN coalesce(result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_all_therapists_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(t) INTO result FROM (
        SELECT 
            th.*,
            w.balance as wallet_balance
        FROM public.therapists th
        LEFT JOIN public.wallets w ON th.id = w.user_id
        ORDER BY th.created_at DESC
    ) t;
    
    RETURN coalesce(result, '[]'::jsonb);
END;
$$;
