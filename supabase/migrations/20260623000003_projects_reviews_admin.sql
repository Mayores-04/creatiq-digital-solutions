-- Owner is now named Admin everywhere. Existing Owner profiles are preserved
-- and converted in-place by the enum rename.
alter type public.app_role rename value 'OWNER' to 'ADMIN';

alter table public.projects
  add column if not exists slug text unique,
  add column if not exists category text,
  add column if not exists project_type text not null default 'CLIENT' check (project_type in ('PERSONAL', 'CLIENT', 'TEAM')),
  add column if not exists lead_outcome text not null default 'OPEN' check (lead_outcome in ('OPEN', 'WON', 'LOST')),
  add column if not exists lost_reason text,
  add column if not exists won_at timestamptz,
  add column if not exists lost_at timestamptz,
  add column if not exists is_published boolean not null default false,
  add column if not exists is_featured boolean not null default false,
  add column if not exists image_url text,
  add column if not exists image_public_id text,
  add column if not exists project_url text,
  add column if not exists technologies jsonb not null default '[]'::jsonb,
  add column if not exists project_date text,
  add column if not exists asset_size text,
  add column if not exists source_image_path text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists published_at timestamptz;

create unique index if not exists projects_slug_unique_idx on public.projects(slug) where slug is not null;
create index if not exists projects_outcome_status_idx on public.projects(lead_outcome, status, created_at desc);
create index if not exists projects_published_sort_idx on public.projects(is_published, sort_order);

create table if not exists public.project_contributors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  external_name text,
  external_email text,
  contribution_role text,
  created_at timestamptz not null default now(),
  check (
    (profile_id is not null and external_name is null)
    or (profile_id is null and external_name is not null)
  )
);
create unique index if not exists project_contributors_profile_unique_idx on public.project_contributors(project_id, profile_id) where profile_id is not null;

insert into public.project_contributors (project_id, profile_id, contribution_role)
select project_id, profile_id, 'Employee'
from public.project_members
on conflict do nothing;

create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  request_token uuid not null unique default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  recipient_email text,
  recipient_name text,
  customer_name text,
  customer_email text,
  rating smallint check (rating between 1 and 5),
  testimonial text,
  status text not null default 'REQUESTED' check (status in ('REQUESTED', 'PENDING', 'APPROVED', 'REJECTED')),
  requested_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_reviews_status_idx on public.customer_reviews(status, created_at desc);
create index if not exists customer_reviews_project_idx on public.customer_reviews(project_id);

create trigger customer_reviews_updated_at before update on public.customer_reviews
  for each row execute procedure public.set_updated_at();

-- Migrate existing portfolio records to the unified projects table. The
-- original source paths are retained, while public images remain null until
-- an Admin uploads a Cloudinary asset.
insert into public.projects (
  id, slug, name, category, description, project_type, lead_outcome, status,
  progress, is_published, is_featured, image_url, image_public_id, project_url,
  technologies, project_date, asset_size, source_image_path, sort_order,
  published_at, completed_at, created_at, updated_at
)
select
  p.id,
  p.slug,
  p.title,
  p.category,
  p.summary,
  case
    when p.slug in ('gocar-express', 'movie-munch', 'alpha-official-2024', 'alpha-admin-dashboard', 'officers-personality-test') then 'TEAM'
    else 'PERSONAL'
  end,
  'WON',
  'COMPLETED'::public.project_status,
  100,
  p.is_published,
  p.is_featured,
  p.image_url,
  p.image_public_id,
  p.project_url,
  p.technologies,
  p.project_date,
  p.asset_size,
  p.source_image_path,
  p.sort_order,
  p.published_at,
  coalesce(p.published_at, now()),
  p.created_at,
  p.updated_at
from public.portfolio_projects p
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  project_type = excluded.project_type,
  lead_outcome = excluded.lead_outcome,
  status = excluded.status,
  progress = excluded.progress,
  is_published = excluded.is_published,
  is_featured = excluded.is_featured,
  image_url = excluded.image_url,
  image_public_id = excluded.image_public_id,
  project_url = excluded.project_url,
  technologies = excluded.technologies,
  project_date = excluded.project_date,
  asset_size = excluded.asset_size,
  source_image_path = excluded.source_image_path,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at;

-- The portfolio entity has been replaced by unified Projects.
drop table if exists public.portfolio_projects cascade;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN' and is_active = true
  );
$$;

drop policy if exists "profiles owner manages" on public.profiles;
create policy "admins manage other profiles" on public.profiles for all to authenticated
  using (public.is_owner() and id <> auth.uid())
  with check (public.is_owner() and id <> auth.uid());

alter table public.project_contributors enable row level security;
alter table public.customer_reviews enable row level security;

create policy "members read contributors" on public.project_contributors for select to authenticated
  using (public.is_project_member(project_id));
create policy "admins manage contributors" on public.project_contributors for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "admins manage customer reviews" on public.customer_reviews for all to authenticated
  using (public.is_owner()) with check (public.is_owner());
create policy "public reads approved reviews" on public.customer_reviews for select to anon, authenticated
  using (status = 'APPROVED');
create policy "public reads published projects" on public.projects for select to anon, authenticated
  using (is_published = true);

create or replace function public.get_customer_review_request(token uuid)
returns table (
  request_token uuid,
  recipient_name text,
  project_name text,
  is_available boolean
) language sql stable security definer set search_path = public as $$
  select
    r.request_token,
    r.recipient_name,
    p.name,
    r.status = 'REQUESTED' and (r.expires_at is null or r.expires_at > now())
  from public.customer_reviews r
  left join public.projects p on p.id = r.project_id
  where r.request_token = token;
$$;

create or replace function public.submit_customer_review(
  token uuid,
  submitted_name text,
  submitted_email text,
  submitted_rating smallint,
  submitted_testimonial text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  review_id uuid;
begin
  if length(trim(submitted_name)) not between 2 and 120
    or length(trim(submitted_email)) > 254
    or submitted_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or submitted_rating not between 1 and 5
    or length(trim(submitted_testimonial)) not between 20 and 2000 then
    raise exception 'Invalid review';
  end if;

  update public.customer_reviews
  set customer_name = trim(submitted_name),
      customer_email = lower(trim(submitted_email)),
      rating = submitted_rating,
      testimonial = trim(submitted_testimonial),
      status = 'PENDING',
      submitted_at = now()
  where request_token = token
    and status = 'REQUESTED'
    and (expires_at is null or expires_at > now())
  returning id into review_id;

  if review_id is null then raise exception 'This review link is no longer available'; end if;
  return review_id;
end;
$$;

revoke all on function public.get_customer_review_request(uuid) from public;
revoke all on function public.submit_customer_review(uuid, text, text, smallint, text) from public;
grant execute on function public.get_customer_review_request(uuid) to anon, authenticated;
grant execute on function public.submit_customer_review(uuid, text, text, smallint, text) to anon, authenticated;
