alter table public.content_planner_items
  add column if not exists planned_time time,
  add column if not exists planned_at timestamptz;

update public.content_planner_items
set planned_time = coalesce(planned_time, time '09:00'),
    planned_at = coalesce(
      planned_at,
      (planned_for::timestamp + coalesce(planned_time, time '09:00')) at time zone 'Asia/Manila'
    )
where planned_time is null
   or planned_at is null;

alter table public.content_planner_items
  alter column planned_time set default time '09:00';

create index if not exists content_planner_items_planned_at_idx
  on public.content_planner_items(planned_at, status);

create table if not exists public.facebook_conversations (
  id uuid primary key default gen_random_uuid(),
  page_id text not null,
  psid text not null,
  display_name text,
  last_event_type text,
  last_message_text text,
  last_message_at timestamptz,
  unread_count integer not null default 0 check (unread_count >= 0),
  raw_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, psid)
);

create table if not exists public.meta_webhook_events (
  id uuid primary key default gen_random_uuid(),
  page_id text not null,
  event_type text not null default 'OTHER'
    check (event_type in ('MESSAGE', 'POSTBACK', 'DELIVERY', 'READ', 'ECHO', 'OTHER')),
  sender_id text,
  recipient_id text,
  participant_id text,
  message_id text,
  message_text text,
  postback_payload text,
  delivery_watermark timestamptz,
  read_watermark timestamptz,
  is_echo boolean not null default false,
  raw_event jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists meta_webhook_events_message_id_unique_idx
  on public.meta_webhook_events(message_id)
  where message_id is not null;

create index if not exists facebook_conversations_last_message_idx
  on public.facebook_conversations(last_message_at desc);

create index if not exists meta_webhook_events_participant_idx
  on public.meta_webhook_events(participant_id, occurred_at desc);

create index if not exists meta_webhook_events_type_idx
  on public.meta_webhook_events(event_type, occurred_at desc);

drop trigger if exists facebook_conversations_updated_at on public.facebook_conversations;
create trigger facebook_conversations_updated_at before update on public.facebook_conversations
  for each row execute procedure public.set_updated_at();

alter table public.facebook_conversations enable row level security;
alter table public.meta_webhook_events enable row level security;

create policy "team read facebook conversations" on public.facebook_conversations
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_active = true));

create policy "admins manage facebook conversations" on public.facebook_conversations
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

create policy "team read meta webhook events" on public.meta_webhook_events
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_active = true));

create policy "admins manage meta webhook events" on public.meta_webhook_events
  for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

update public.access_roles
set permissions = permissions || '["facebook"]'::jsonb
where name in ('Content Manager', 'Full-Stack Developer', 'Project Coordinator')
  and not (permissions ? 'facebook');
