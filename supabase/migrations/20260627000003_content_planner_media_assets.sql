alter table public.content_planner_items
  add column if not exists media_assets jsonb not null default '[]'::jsonb,
  add column if not exists platform_targets jsonb not null default '[]'::jsonb,
  add column if not exists automation_metadata jsonb not null default '{}'::jsonb;

create index if not exists content_planner_items_media_assets_gin_idx
  on public.content_planner_items using gin (media_assets);

comment on column public.content_planner_items.media_assets is
  'Ordered media prepared for planned content. Each item stores provider, url, public id, mime type, and filename for future social publishing automation.';

comment on column public.content_planner_items.platform_targets is
  'Future automation targets such as facebook_page, instagram, linkedin, or website.';

comment on column public.content_planner_items.automation_metadata is
  'Future automation state such as remote post id, publish attempts, errors, or scheduler metadata.';
