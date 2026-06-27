alter table public.projects
  add column if not exists service_id uuid references public.services(id) on delete set null;

create index if not exists projects_service_idx on public.projects(service_id);

update public.projects p
set service_id = s.id,
    category = s.title
from public.services s
where s.slug = case
  when lower(coalesce(p.name, '')) in ('tuon', 'hibla') then 'mobile-app'
  else 'web-custom-systems'
end
and p.service_id is null;

create table if not exists public.access_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists access_role_id uuid references public.access_roles(id) on delete set null;

create table if not exists public.content_planner_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text not null default 'Website',
  content_type text not null default 'Post',
  status text not null default 'IDEA' check (status in ('IDEA', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  planned_for date not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_planner_items_planned_for_idx on public.content_planner_items(planned_for, status);
create index if not exists content_planner_items_owner_idx on public.content_planner_items(owner_id);

create trigger access_roles_updated_at before update on public.access_roles
  for each row execute procedure public.set_updated_at();
create trigger content_planner_items_updated_at before update on public.content_planner_items
  for each row execute procedure public.set_updated_at();

insert into public.access_roles (name, description, permissions, is_system) values
  ('Full-Stack Developer', 'Builds websites, systems, integrations, and delivery tasks.', '["overview","projects","tasks","content-planner","notifications","activity"]'::jsonb, true),
  ('Graphic Designer', 'Handles visual design, creative assets, branding, and content planning.', '["overview","projects","tasks","services","content-planner","notifications","activity"]'::jsonb, true),
  ('Content Manager', 'Plans, schedules, and reviews content and customer-facing updates.', '["overview","customer-reviews","services","content-planner","notifications","activity"]'::jsonb, true),
  ('Project Coordinator', 'Tracks inquiries, clients, delivery progress, and reports.', '["overview","inquiries","clients","projects","tasks","employees","reports","content-planner","notifications","activity"]'::jsonb, true)
on conflict (name) do nothing;

alter table public.access_roles enable row level security;
alter table public.content_planner_items enable row level security;

create policy "authenticated read access roles" on public.access_roles for select to authenticated using (true);
create policy "admins manage access roles" on public.access_roles for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "team reads content planner" on public.content_planner_items for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_active = true));
create policy "admins manage content planner" on public.content_planner_items for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
