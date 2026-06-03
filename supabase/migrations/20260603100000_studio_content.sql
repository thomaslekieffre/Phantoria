-- Studio : tables de contenu live (esprits, gacha, histoire, reliques run)

-- Esprits / ennemis (payload = CharacterTemplate JSON)
create table if not exists public.spirit_templates (
  template_key text primary key,
  kind text not null check (kind in ('catalog', 'enemy')),
  hub_id text,
  name text not null,
  tribe text not null,
  rarity text not null,
  payload jsonb not null default '{}',
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists spirit_templates_kind_idx on public.spirit_templates (kind);
create index if not exists spirit_templates_hub_id_idx on public.spirit_templates (hub_id) where hub_id is not null;

-- Gacha
create table if not exists public.gacha_pools (
  id text primary key,
  ticket_cost int not null default 1,
  gem_cost int not null default 50,
  multi_count int not null default 10,
  active boolean not null default true
);

create table if not exists public.gacha_pool_entries (
  id uuid primary key default gen_random_uuid(),
  pool_id text not null references public.gacha_pools (id) on delete cascade,
  hub_id text not null,
  template_key text not null,
  name text not null,
  tribe text not null,
  hue text not null default '#86efac',
  rarity text not null,
  sort_order int not null default 0,
  unique (pool_id, hub_id)
);

create index if not exists gacha_pool_entries_pool_idx on public.gacha_pool_entries (pool_id, sort_order);

-- Histoire
create table if not exists public.story_zones (
  id int primary key,
  name text not null,
  emoji text not null default '📜',
  tribe text not null,
  level_count int not null default 15,
  sort_order int not null default 0
);

create table if not exists public.story_levels (
  id text primary key,
  zone_id int not null references public.story_zones (id) on delete cascade,
  level_index int not null,
  title text not null,
  intro text not null default '',
  outro text not null default '',
  enemies jsonb not null default '[]',
  stars_round3 int not null default 10,
  active boolean not null default true,
  unique (zone_id, level_index)
);

create index if not exists story_levels_zone_idx on public.story_levels (zone_id, level_index);

-- Reliques run (payload = RunRewardDef JSON complet)
create table if not exists public.run_rewards (
  id text primary key,
  payload jsonb not null,
  sort_order int not null default 0,
  active boolean not null default true
);

-- RLS : lecture publique, écriture admin
alter table public.spirit_templates enable row level security;
alter table public.gacha_pools enable row level security;
alter table public.gacha_pool_entries enable row level security;
alter table public.story_zones enable row level security;
alter table public.story_levels enable row level security;
alter table public.run_rewards enable row level security;

create policy "spirit_templates_read"
  on public.spirit_templates for select to anon, authenticated using (true);
create policy "spirit_templates_admin_insert"
  on public.spirit_templates for insert to authenticated with check (public.is_game_admin());
create policy "spirit_templates_admin_update"
  on public.spirit_templates for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "spirit_templates_admin_delete"
  on public.spirit_templates for delete to authenticated using (public.is_game_admin());

create policy "gacha_pools_read"
  on public.gacha_pools for select to anon, authenticated using (true);
create policy "gacha_pools_admin_insert"
  on public.gacha_pools for insert to authenticated with check (public.is_game_admin());
create policy "gacha_pools_admin_update"
  on public.gacha_pools for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "gacha_pools_admin_delete"
  on public.gacha_pools for delete to authenticated using (public.is_game_admin());

create policy "gacha_pool_entries_read"
  on public.gacha_pool_entries for select to anon, authenticated using (true);
create policy "gacha_pool_entries_admin_insert"
  on public.gacha_pool_entries for insert to authenticated with check (public.is_game_admin());
create policy "gacha_pool_entries_admin_update"
  on public.gacha_pool_entries for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "gacha_pool_entries_admin_delete"
  on public.gacha_pool_entries for delete to authenticated using (public.is_game_admin());

create policy "story_zones_read"
  on public.story_zones for select to anon, authenticated using (true);
create policy "story_zones_admin_insert"
  on public.story_zones for insert to authenticated with check (public.is_game_admin());
create policy "story_zones_admin_update"
  on public.story_zones for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "story_zones_admin_delete"
  on public.story_zones for delete to authenticated using (public.is_game_admin());

create policy "story_levels_read"
  on public.story_levels for select to anon, authenticated using (true);
create policy "story_levels_admin_insert"
  on public.story_levels for insert to authenticated with check (public.is_game_admin());
create policy "story_levels_admin_update"
  on public.story_levels for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "story_levels_admin_delete"
  on public.story_levels for delete to authenticated using (public.is_game_admin());

create policy "run_rewards_read"
  on public.run_rewards for select to anon, authenticated using (true);
create policy "run_rewards_admin_insert"
  on public.run_rewards for insert to authenticated with check (public.is_game_admin());
create policy "run_rewards_admin_update"
  on public.run_rewards for update to authenticated
  using (public.is_game_admin()) with check (public.is_game_admin());
create policy "run_rewards_admin_delete"
  on public.run_rewards for delete to authenticated using (public.is_game_admin());
