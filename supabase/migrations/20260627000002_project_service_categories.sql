create table if not exists public.project_services (
  project_id uuid not null references public.projects(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, service_id)
);

create index if not exists project_services_service_idx
  on public.project_services(service_id, project_id);

alter table public.project_services enable row level security;

drop policy if exists "public reads published project services" on public.project_services;
create policy "public reads published project services" on public.project_services
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.is_published = true
    )
  );

drop policy if exists "members read project services" on public.project_services;
create policy "members read project services" on public.project_services
  for select to authenticated
  using (public.is_project_member(project_id));

drop policy if exists "admins manage project services" on public.project_services;
create policy "admins manage project services" on public.project_services
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

insert into public.project_services (project_id, service_id)
select p.id, p.service_id
from public.projects p
where p.service_id is not null
on conflict do nothing;

insert into public.project_services (project_id, service_id)
select p.id, s.id
from public.projects p
join public.services s on s.slug = 'mobile-app'
where lower(p.name) in ('tuon', 'hibla')
on conflict do nothing;

insert into public.project_services (project_id, service_id)
select p.id, s.id
from public.projects p
join public.services s on s.slug = 'web-custom-systems'
where lower(p.name) not in ('tuon', 'hibla')
  and not exists (
    select 1
    from public.project_services ps
    where ps.project_id = p.id
  )
on conflict do nothing;

update public.projects p
set service_id = s.id,
    category = coalesce(p.category, s.title)
from public.services s
where s.slug = 'mobile-app'
  and lower(p.name) in ('tuon', 'hibla');

update public.projects p
set service_id = s.id,
    category = coalesce(p.category, s.title)
from public.services s
where s.slug = 'web-custom-systems'
  and lower(p.name) not in ('tuon', 'hibla')
  and p.service_id is null;
