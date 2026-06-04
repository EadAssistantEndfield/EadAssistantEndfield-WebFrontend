create table if not exists public.blueprint_cache (
  share_code text primary key,
  raw_response jsonb not null,
  source text not null default 'upstream_api',
  status text not null default 'ready',
  parser_version text not null default '1',
  response_hash text,
  hit_count integer not null default 0,
  first_cached_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  last_refreshed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blueprint_cache_has_data check (raw_response ? 'blueprint_data'),
  constraint blueprint_cache_status check (status in ('ready', 'stale', 'failed'))
);

create index if not exists blueprint_cache_status_expires_idx
  on public.blueprint_cache (status, expires_at);

create index if not exists blueprint_cache_refreshed_idx
  on public.blueprint_cache (last_refreshed_at desc);

alter table public.blueprint_cache enable row level security;

grant select on public.blueprint_cache to anon;
grant select on public.blueprint_cache to authenticated;
grant select, insert, update, delete on public.blueprint_cache to service_role;

drop policy if exists "Public can read ready blueprint cache" on public.blueprint_cache;
create policy "Public can read ready blueprint cache"
on public.blueprint_cache
for select
to anon, authenticated
using (
  status = 'ready'
  and (expires_at is null or expires_at > now())
);

create or replace function public.set_blueprint_cache_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_blueprint_cache_updated_at() from public;
revoke all on function public.set_blueprint_cache_updated_at() from anon, authenticated;

drop trigger if exists blueprint_cache_set_updated_at on public.blueprint_cache;
create trigger blueprint_cache_set_updated_at
before update on public.blueprint_cache
for each row
execute function public.set_blueprint_cache_updated_at();

create table if not exists public.blueprint_cache_events (
  id bigint generated always as identity primary key,
  share_code text not null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.blueprint_cache_events enable row level security;

revoke all on public.blueprint_cache_events from anon, authenticated;
grant select, insert on public.blueprint_cache_events to service_role;

drop policy if exists "Service role can manage blueprint cache events" on public.blueprint_cache_events;
create policy "Service role can manage blueprint cache events"
on public.blueprint_cache_events
for all
to service_role
using (true)
with check (true);
