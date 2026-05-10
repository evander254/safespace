-- ============ ADMIN TABLE & SUPER ADMIN ============

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In a production app, this should be hashed
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert Super Admin
INSERT INTO public.admins (username, password, full_name)
VALUES ('AdminZarc', 'BabakeEvanda@97', 'Super Admin')
ON CONFLICT (username) DO NOTHING;

-- RPC for secure (ish) credential checking
CREATE OR REPLACE FUNCTION public.check_admin_credentials(p_username TEXT, p_password TEXT)
RETURNS TABLE (id UUID, username TEXT, full_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.username, a.full_name
    FROM public.admins a
    WHERE a.username = p_username AND a.password = p_password;
END;
$$;

-- RLS (Admins table should be private)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins are invisible" ON public.admins FOR ALL USING (false);
