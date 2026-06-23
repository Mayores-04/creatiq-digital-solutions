create extension if not exists pgcrypto;

create type public.app_role as enum ('OWNER', 'STAFF');
create type public.inquiry_status as enum ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');
create type public.project_status as enum ('LEAD', 'PLANNING', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ON_HOLD');
create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'DONE');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Team member',
  email text not null,
  role public.app_role not null default 'STAFF',
  job_title text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_settings (
  id boolean primary key default true check (id),
  company_name text not null default 'Creatiq Digital Solutions',
  company_email text not null default 'creatiq.digitalsolutions@gmail.com',
  location text default 'Cainta, Rizal',
  logo_url text default '/images/brand/creatiq-landscape.png',
  favicon_url text default '/images/brand/creatiq-icon-dark.png',
  social_links jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon_name text not null default 'Code2',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text not null,
  image_url text,
  image_public_id text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  services jsonb not null default '[]'::jsonb,
  description text not null,
  status public.inquiry_status not null default 'NEW',
  source text not null default 'website',
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  inquiry_id uuid unique references public.inquiries(id) on delete set null,
  name text not null,
  description text,
  status public.project_status not null default 'LEAD',
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inquiries
  add constraint inquiries_project_id_fkey foreign key (project_id) references public.projects(id) on delete set null;

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'TODO',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  byte_size bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index inquiries_status_created_at_idx on public.inquiries(status, created_at desc);
create index projects_status_due_date_idx on public.projects(status, due_date);
create index tasks_project_status_idx on public.tasks(project_id, status);
create index tasks_assignee_status_idx on public.tasks(assignee_id, status);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_project_progress_from_tasks()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_project uuid;
  total_tasks integer;
  completed_tasks integer;
  next_progress integer;
begin
  target_project := case when tg_op = 'DELETE' then old.project_id else new.project_id end;
  select count(*), count(*) filter (where status = 'DONE')
  into total_tasks, completed_tasks
  from public.tasks
  where project_id = target_project;

  if total_tasks = 0 then
    update public.projects set progress = 0, completed_at = null where id = target_project;
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  next_progress := round((completed_tasks::numeric / total_tasks::numeric) * 100);
  update public.projects
  set progress = next_progress,
      status = case
        when completed_tasks = total_tasks then 'COMPLETED'::public.project_status
        when status = 'COMPLETED' then 'ACTIVE'::public.project_status
        else status
      end,
      completed_at = case when completed_tasks = total_tasks then coalesce(completed_at, now()) else null end
  where id = target_project;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Team member'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger company_settings_updated_at before update on public.company_settings
  for each row execute procedure public.set_updated_at();
create trigger services_updated_at before update on public.services
  for each row execute procedure public.set_updated_at();
create trigger portfolio_projects_updated_at before update on public.portfolio_projects
  for each row execute procedure public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute procedure public.set_updated_at();
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger tasks_sync_project_progress after insert or update or delete on public.tasks
  for each row execute procedure public.sync_project_progress_from_tasks();

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'OWNER' and is_active = true
  );
$$;

create or replace function public.is_project_member(target_project uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_owner() or exists (
    select 1 from public.project_members
    where project_id = target_project and profile_id = auth.uid()
  );
$$;

-- Staff have narrowly-scoped RPCs for their operational work.  Direct table
-- updates would let a Staff user alter protected fields through the REST API,
-- even if the admin UI did not expose those inputs.
create or replace function public.staff_update_inquiry(
  target_inquiry uuid,
  next_status public.inquiry_status,
  next_internal_notes text default null
)
returns public.inquiries language plpgsql security definer set search_path = public as $$
declare
  updated_inquiry public.inquiries;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_active = true) then
    raise exception 'Not authorized';
  end if;

  update public.inquiries
  set status = next_status, internal_notes = next_internal_notes
  where id = target_inquiry
  returning * into updated_inquiry;

  if updated_inquiry is null then raise exception 'Inquiry not found'; end if;
  return updated_inquiry;
end;
$$;

create or replace function public.staff_update_project_progress(
  target_project uuid,
  next_status public.project_status,
  next_progress integer
)
returns public.projects language plpgsql security definer set search_path = public as $$
declare
  updated_project public.projects;
begin
  if next_progress < 0 or next_progress > 100 or not public.is_project_member(target_project) then
    raise exception 'Not authorized';
  end if;

  update public.projects
  set status = next_status,
      progress = next_progress,
      completed_at = case when next_status = 'COMPLETED' then coalesce(completed_at, now()) else null end
  where id = target_project
  returning * into updated_project;

  if updated_project is null then raise exception 'Project not found'; end if;
  return updated_project;
end;
$$;

create or replace function public.staff_update_task_status(
  target_task uuid,
  next_status public.task_status
)
returns public.tasks language plpgsql security definer set search_path = public as $$
declare
  updated_task public.tasks;
begin
  if not exists (
    select 1 from public.tasks where id = target_task and assignee_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  update public.tasks
  set status = next_status,
      completed_at = case when next_status = 'DONE' then coalesce(completed_at, now()) else null end
  where id = target_task
  returning * into updated_task;

  if updated_task is null then raise exception 'Task not found'; end if;
  return updated_task;
end;
$$;

create or replace function public.submit_website_inquiry(
  inquiry_name text,
  inquiry_email text,
  inquiry_services jsonb,
  inquiry_description text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  created_id uuid;
begin
  if length(trim(inquiry_name)) not between 2 and 100
    or length(trim(inquiry_email)) > 254
    or inquiry_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or jsonb_typeof(inquiry_services) <> 'array'
    or jsonb_array_length(inquiry_services) not between 1 and 8
    or length(trim(inquiry_description)) not between 10 and 5000 then
    raise exception 'Invalid inquiry';
  end if;

  insert into public.inquiries (name, email, services, description, source, status)
  values (trim(inquiry_name), lower(trim(inquiry_email)), inquiry_services, trim(inquiry_description), 'website', 'NEW')
  returning id into created_id;
  return created_id;
end;
$$;

insert into public.company_settings (id) values (true) on conflict (id) do nothing;

insert into public.services (slug, title, description, icon_name, sort_order) values
  ('graphic-design', 'Graphic Design', 'Visual storytelling that captures attention and defines brand personality.', 'Brush', 1),
  ('web-custom-systems', 'Web & Custom Systems', 'High-performance websites and internal management systems built for scale.', 'Code2', 2),
  ('social-media', 'Social Media', 'Digital strategy and content that drives real business growth.', 'Share2', 3),
  ('branding-logo', 'Branding & Logo', 'Crafting iconic identities that resonate with your target audience.', 'BadgeCheck', 4),
  ('mobile-app', 'Mobile App', 'Intuitive mobile experiences designed for the palm of your hand.', 'Smartphone', 5),
  ('ui-ux-design', 'UI/UX Design', 'User-centered interfaces optimized for clarity, conversion, and delight.', 'PenTool', 6),
  ('video-editing', 'Video Editing', 'Professional video editing, motion graphics, and marketing visuals.', 'Video', 7)
on conflict (slug) do nothing;

insert into public.portfolio_projects (slug, category, title, summary, is_published, sort_order) values
  ('brand-campaign-system', 'Social Media', 'Brand Campaign System', 'Strategy, content design, and visual direction for online growth.', true, 1),
  ('tech-brand-rebrand', 'Identity', 'Tech Brand Rebrand', 'Logo design, brand direction, and complete visual identity.', true, 2),
  ('business-website-platform', 'Web Development', 'Business Website Platform', 'Modern website design with responsive and conversion-focused UI.', true, 3)
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('creatiq-digital-solutions', 'creatiq-digital-solutions', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.clients enable row level security;
alter table public.inquiries enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.project_documents enable row level security;
alter table public.activity_logs enable row level security;

create policy "staff read active profiles" on public.profiles for select to authenticated
  using (is_active = true);
create policy "profiles owner manages" on public.profiles for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "profiles update self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "owners manage company settings" on public.company_settings for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "public reads company settings" on public.company_settings for select to anon, authenticated
  using (true);
create policy "owners manage services" on public.services for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "public reads published services" on public.services for select to anon, authenticated
  using (is_published = true);
create policy "owners manage portfolio" on public.portfolio_projects for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "public reads published portfolio" on public.portfolio_projects for select to anon, authenticated
  using (is_published = true);

create policy "staff read clients" on public.clients for select to authenticated using (true);
create policy "owners manage clients" on public.clients for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "staff read inquiries" on public.inquiries for select to authenticated using (true);
create policy "owners manage inquiries" on public.inquiries for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "members read projects" on public.projects for select to authenticated
  using (public.is_project_member(id));
create policy "owners manage projects" on public.projects for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "members read project members" on public.project_members for select to authenticated
  using (public.is_project_member(project_id));
create policy "owners manage project members" on public.project_members for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "members read tasks" on public.tasks for select to authenticated
  using (public.is_project_member(project_id));
create policy "owners manage tasks" on public.tasks for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "members read documents" on public.project_documents for select to authenticated
  using (public.is_project_member(project_id));
create policy "owners manage documents" on public.project_documents for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "members insert project documents" on public.project_documents for insert to authenticated
  with check (public.is_project_member(project_id));

create policy "staff read activity" on public.activity_logs for select to authenticated using (true);
create policy "authenticated log activity" on public.activity_logs for insert to authenticated
  with check (actor_id = auth.uid());

create policy "project members read private files" on storage.objects for select to authenticated
  using (bucket_id = 'creatiq-digital-solutions' and public.is_project_member((storage.foldername(name))[1]::uuid));
create policy "project members upload private files" on storage.objects for insert to authenticated
  with check (bucket_id = 'creatiq-digital-solutions' and public.is_project_member((storage.foldername(name))[1]::uuid));
create policy "owners delete private files" on storage.objects for delete to authenticated
  using (bucket_id = 'creatiq-digital-solutions' and public.is_owner());

revoke all on function public.staff_update_inquiry(uuid, public.inquiry_status, text) from public;
revoke all on function public.staff_update_project_progress(uuid, public.project_status, integer) from public;
revoke all on function public.staff_update_task_status(uuid, public.task_status) from public;
grant execute on function public.staff_update_inquiry(uuid, public.inquiry_status, text) to authenticated;
grant execute on function public.staff_update_project_progress(uuid, public.project_status, integer) to authenticated;
grant execute on function public.staff_update_task_status(uuid, public.task_status) to authenticated;
revoke all on function public.submit_website_inquiry(text, text, jsonb, text) from public;
grant execute on function public.submit_website_inquiry(text, text, jsonb, text) to anon, authenticated;
