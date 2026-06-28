alter table public.facebook_conversations replica identity full;
alter table public.meta_webhook_events replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.facebook_conversations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.meta_webhook_events;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
