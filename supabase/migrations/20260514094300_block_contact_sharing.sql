
-- ============ CONTACT SHARING BLOCK ============
-- This trigger blocks messages containing phone numbers, emails, social handles, or links.

create or replace function public.check_contact_info()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Regex explanation:
  -- (07\d{8}|01\d{8}) -> Common Kenyan phone number formats
  -- @ -> Emails or social handles
  -- http|www|\.com -> External links and common domains
  if new.message ~* '(07\d{8}|01\d{8}|@|http|www|\.com)' then
    raise exception 'For your safety and privacy, sharing contact details is not allowed.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_contact_sharing on public.messages;
create trigger trg_block_contact_sharing
  before insert on public.messages
  for each row
  execute function public.check_contact_info();
