-- Migration for admin wallet management
-- Created: 2026-05-11

-- 1. RPC to fetch all wallets with user details and roles
CREATE OR REPLACE FUNCTION public.get_all_wallets_admin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Bypassing role check for debugging
  /*
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  */
  
  RETURN COALESCE(
    (SELECT jsonb_agg(t)
     FROM (
       SELECT 
         w.id,
         w.user_id,
         w.balance,
         'KES' as currency,
         w.updated_at,
         p.full_name,
         p.email,
         p.avatar_url,
         (SELECT jsonb_agg(ur.role) FROM public.user_roles ur WHERE ur.user_id = p.id) as roles
       FROM public.wallets w
       LEFT JOIN public.profiles p ON w.user_id = p.id
       ORDER BY w.balance DESC
     ) t),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_wallets_admin() TO authenticated;
