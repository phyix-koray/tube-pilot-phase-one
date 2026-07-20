-- TubePilot initial schema
-- Kendi Supabase projende SQL Editor'de bir kez çalıştır.
-- Idempotent: tekrar çalıştırılırsa hata vermez.

------------------------------------------------------------
-- Extensions
------------------------------------------------------------
create extension if not exists "pgcrypto";

------------------------------------------------------------
-- profiles: 1:1 with auth.users
------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- updated_at helper
------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

------------------------------------------------------------
-- skills
------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  file_md text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists skills_user_idx on public.skills(user_id, updated_at desc);

grant select, insert, update, delete on public.skills to authenticated;
grant all on public.skills to service_role;
alter table public.skills enable row level security;

drop policy if exists "skills owner all" on public.skills;
create policy "skills owner all" on public.skills
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists skills_updated_at on public.skills;
create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

------------------------------------------------------------
-- skill_messages
------------------------------------------------------------
create table if not exists public.skill_messages (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists skill_messages_skill_idx on public.skill_messages(skill_id, created_at);

grant select, insert, delete on public.skill_messages to authenticated;
grant all on public.skill_messages to service_role;
alter table public.skill_messages enable row level security;

drop policy if exists "skill_messages owner all" on public.skill_messages;
create policy "skill_messages owner all" on public.skill_messages
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- skill_versions
------------------------------------------------------------
create table if not exists public.skill_versions (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_md text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists skill_versions_skill_idx on public.skill_versions(skill_id, created_at desc);

grant select, insert, delete on public.skill_versions to authenticated;
grant all on public.skill_versions to service_role;
alter table public.skill_versions enable row level security;

drop policy if exists "skill_versions owner all" on public.skill_versions;
create policy "skill_versions owner all" on public.skill_versions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- agent_skill_links
------------------------------------------------------------
create table if not exists public.agent_skill_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, agent_id, skill_id)
);
create index if not exists agent_skill_links_user_agent_idx on public.agent_skill_links(user_id, agent_id);

grant select, insert, delete on public.agent_skill_links to authenticated;
grant all on public.agent_skill_links to service_role;
alter table public.agent_skill_links enable row level security;

drop policy if exists "agent_skill_links owner all" on public.agent_skill_links;
create policy "agent_skill_links owner all" on public.agent_skill_links
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- agent_skill_uploads
------------------------------------------------------------
create table if not exists public.agent_skill_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  name text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists agent_skill_uploads_user_agent_idx on public.agent_skill_uploads(user_id, agent_id);

grant select, insert, delete on public.agent_skill_uploads to authenticated;
grant all on public.agent_skill_uploads to service_role;
alter table public.agent_skill_uploads enable row level security;

drop policy if exists "agent_skill_uploads owner all" on public.agent_skill_uploads;
create policy "agent_skill_uploads owner all" on public.agent_skill_uploads
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- channels
------------------------------------------------------------
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  provider text not null default 'youtube',
  external_id text,
  avatar_url text,
  metadata_json jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now()
);
create index if not exists channels_user_idx on public.channels(user_id, connected_at desc);

grant select, insert, update, delete on public.channels to authenticated;
grant all on public.channels to service_role;
alter table public.channels enable row level security;

drop policy if exists "channels owner all" on public.channels;
create policy "channels owner all" on public.channels
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- agent_runs
------------------------------------------------------------
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  status text not null default 'draft' check (status in ('draft','queued','running','completed','failed','cancelled')),
  channel_id uuid references public.channels(id) on delete set null,
  config_json jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_runs_user_idx on public.agent_runs(user_id, created_at desc);
create index if not exists agent_runs_agent_idx on public.agent_runs(user_id, agent_id, created_at desc);

grant select, insert, update, delete on public.agent_runs to authenticated;
grant all on public.agent_runs to service_role;
alter table public.agent_runs enable row level security;

drop policy if exists "agent_runs owner all" on public.agent_runs;
create policy "agent_runs owner all" on public.agent_runs
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists agent_runs_updated_at on public.agent_runs;
create trigger agent_runs_updated_at before update on public.agent_runs
  for each row execute function public.set_updated_at();

------------------------------------------------------------
-- content_plan_rows
------------------------------------------------------------
create table if not exists public.content_plan_rows (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0,
  date date,
  video_title text,
  video_topic text,
  video_length text,
  video_format text,
  art_style text,
  web_search boolean not null default false,
  deep_research boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists content_plan_rows_run_idx on public.content_plan_rows(run_id, position);

grant select, insert, update, delete on public.content_plan_rows to authenticated;
grant all on public.content_plan_rows to service_role;
alter table public.content_plan_rows enable row level security;

drop policy if exists "content_plan_rows owner all" on public.content_plan_rows;
create policy "content_plan_rows owner all" on public.content_plan_rows
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists content_plan_rows_updated_at on public.content_plan_rows;
create trigger content_plan_rows_updated_at before update on public.content_plan_rows
  for each row execute function public.set_updated_at();

------------------------------------------------------------
-- videos
------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  run_id uuid references public.agent_runs(id) on delete set null,
  title text not null default 'Untitled',
  description text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','scheduled','processing','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  thumbnail_url text,
  video_url text,
  duration_seconds integer,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists videos_user_idx on public.videos(user_id, created_at desc);
create index if not exists videos_channel_idx on public.videos(channel_id, created_at desc);

grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

drop policy if exists "videos owner all" on public.videos;
create policy "videos owner all" on public.videos
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists videos_updated_at on public.videos;
create trigger videos_updated_at before update on public.videos
  for each row execute function public.set_updated_at();
