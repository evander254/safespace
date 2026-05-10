
-- Set search_path on remaining functions
create or replace function public.handle_updated_at()
returns trigger language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

-- Revoke public execute on security-definer trigger/internal functions
revoke execute on function public.handle_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_therapist_rating() from public, anon, authenticated;

-- has_role is intentionally callable by authenticated users (used inside RLS)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
