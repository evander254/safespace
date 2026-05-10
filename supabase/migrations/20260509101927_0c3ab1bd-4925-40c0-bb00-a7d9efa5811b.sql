
-- ============ ENUMS ============
create type public.app_role as enum ('client','therapist','admin');
create type public.booking_status as enum ('pending','confirmed','completed','cancelled');
create type public.payment_status as enum ('pending','success','failed');
create type public.subscription_plan as enum ('basic','premium');
create type public.subscription_status as enum ('active','expired','cancelled');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- has_role security definer to avoid recursive RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ THERAPISTS ============
create table public.therapists (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  bio text,
  specializations text[] not null default '{}',
  languages text[] not null default '{}',
  price_per_session numeric(10,2) not null default 0,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  availability jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ BOOKINGS ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  session_date date not null,
  session_time time not null,
  status public.booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (therapist_id, session_date, session_time)
);

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  phone_number text not null,
  mpesa_receipt text,
  checkout_request_id text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ VIDEO SESSIONS ============
create table public.video_sessions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  meeting_link text not null,
  created_at timestamptz not null default now()
);

-- ============ REVIEWS ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============ SUBSCRIPTIONS ============
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null default 'active',
  start_date date not null default current_date,
  end_date date not null,
  created_at timestamptz not null default now()
);

-- ============ TRIGGERS ============
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.handle_updated_at();
create trigger trg_therapists_updated before update on public.therapists for each row execute function public.handle_updated_at();
create trigger trg_bookings_updated before update on public.bookings for each row execute function public.handle_updated_at();
create trigger trg_payments_updated before update on public.payments for each row execute function public.handle_updated_at();

-- Auto-create profile + default 'client' role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'client') on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update therapist rating on review
create or replace function public.update_therapist_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.therapists t
  set rating = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where therapist_id = t.id), 0),
      reviews_count = (select count(*) from public.reviews where therapist_id = t.id)
  where t.id = new.therapist_id;
  return new;
end; $$;

create trigger trg_review_rating after insert or update on public.reviews
  for each row execute function public.update_therapist_rating();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.therapists enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.video_sessions enable row level security;
alter table public.reviews enable row level security;
alter table public.subscriptions enable row level security;

-- profiles
create policy "profiles self select" on public.profiles for select using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "roles self read" on public.user_roles for select using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin manage" on public.user_roles for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- therapists: directory is public for approved; therapists can manage their own; admins manage all
create policy "therapists public approved" on public.therapists for select using (is_approved = true or id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "therapists self insert" on public.therapists for insert with check (id = auth.uid());
create policy "therapists self update" on public.therapists for update using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "therapists admin delete" on public.therapists for delete using (public.has_role(auth.uid(),'admin'));

-- bookings: client or therapist involved, or admin
create policy "bookings read" on public.bookings for select using (client_id = auth.uid() or therapist_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "bookings create client" on public.bookings for insert with check (client_id = auth.uid());
create policy "bookings update parties" on public.bookings for update using (client_id = auth.uid() or therapist_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- payments: only the user or admin
create policy "payments read" on public.payments for select using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "payments insert" on public.payments for insert with check (user_id = auth.uid());

-- messages: sender or therapist/client of the booking
create policy "messages read" on public.messages for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.client_id = auth.uid() or b.therapist_id = auth.uid()))
  or public.has_role(auth.uid(),'admin')
);
create policy "messages insert" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.bookings b where b.id = booking_id and b.status = 'confirmed' and (b.client_id = auth.uid() or b.therapist_id = auth.uid()))
);
create policy "messages update read" on public.messages for update using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.client_id = auth.uid() or b.therapist_id = auth.uid()))
);

-- video_sessions
create policy "video read" on public.video_sessions for select using (
  exists (select 1 from public.bookings b where b.id = booking_id and (b.client_id = auth.uid() or b.therapist_id = auth.uid()))
  or public.has_role(auth.uid(),'admin')
);

-- reviews: client of completed booking; visible to all (for therapist directory)
create policy "reviews public read" on public.reviews for select using (true);
create policy "reviews insert client" on public.reviews for insert with check (
  client_id = auth.uid()
  and exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid() and b.status = 'completed')
);

-- subscriptions
create policy "subs self read" on public.subscriptions for select using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "subs self insert" on public.subscriptions for insert with check (user_id = auth.uid());
create policy "subs self update" on public.subscriptions for update using (user_id = auth.uid());

-- Realtime for messages
alter publication supabase_realtime add table public.messages;
