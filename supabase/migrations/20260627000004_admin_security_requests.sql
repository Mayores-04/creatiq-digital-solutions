create table if not exists public.admin_security_requests (
  id uuid primary key default gen_random_uuid(),
  request_token uuid not null default gen_random_uuid() unique,
  action text not null check (action in ('DEACTIVATE_ADMIN', 'CHANGE_ADMIN_ROLE')),
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  requested_role text check (requested_role in ('ADMIN', 'STAFF')),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  details jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_security_requests_target_idx
  on public.admin_security_requests(target_profile_id, status, expires_at desc);

alter table public.admin_security_requests enable row level security;

drop policy if exists "admins manage security requests" on public.admin_security_requests;
create policy "admins manage security requests" on public.admin_security_requests
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());
