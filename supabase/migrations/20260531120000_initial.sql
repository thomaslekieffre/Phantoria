-- Phantoria — profil joueur, roster hub, run active

create extension if not exists "pgcrypto";

-- ─── Profil ───
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Esprit',
  level int not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_currencies (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  gold int not null default 1200 check (gold >= 0),
  gems int not null default 35 check (gems >= 0),
  tickets int not null default 2 check (tickets >= 0)
);

-- Esprits possédés (collection / hub)
create table public.player_spirits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hub_id text not null,
  template_key text not null,
  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  hp_pct int not null default 100 check (hp_pct between 0 and 100),
  unlocked_at timestamptz not null default now(),
  unique (user_id, hub_id)
);

create index player_spirits_user_idx on public.player_spirits (user_id);

-- Roue hub ×6
create table public.roster_slots (
  user_id uuid not null references public.profiles (id) on delete cascade,
  slot_index int not null check (slot_index between 0 and 5),
  spirit_id uuid references public.player_spirits (id) on delete set null,
  on_field boolean not null default false,
  primary key (user_id, slot_index)
);

-- Run roguelite en cours (1 par joueur)
create table public.active_runs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─── RLS ───
alter table public.profiles enable row level security;
alter table public.player_currencies enable row level security;
alter table public.player_spirits enable row level security;
alter table public.roster_slots enable row level security;
alter table public.active_runs enable row level security;

create policy "profiles own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "currencies own" on public.player_currencies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spirits own" on public.player_spirits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "roster own" on public.roster_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "runs own" on public.active_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Seed nouveau compte ───
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := new.id;
  s_bram uuid;
  s_nyx uuid;
  s_luma uuid;
  s_kiro uuid;
begin
  insert into public.profiles (id, display_name)
  values (uid, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Esprit'));

  insert into public.player_currencies (user_id) values (uid);

  insert into public.player_spirits (user_id, hub_id, template_key)
  values
    (uid, 'bram', 'bram_vaillant'),
    (uid, 'nyx', 'nyx_mysterieux'),
    (uid, 'luma', 'luma_mignon'),
    (uid, 'kiro', 'kiro_perfide');

  select id into s_bram from public.player_spirits where user_id = uid and hub_id = 'bram';
  select id into s_nyx from public.player_spirits where user_id = uid and hub_id = 'nyx';
  select id into s_luma from public.player_spirits where user_id = uid and hub_id = 'luma';
  select id into s_kiro from public.player_spirits where user_id = uid and hub_id = 'kiro';

  insert into public.roster_slots (user_id, slot_index, spirit_id, on_field) values
    (uid, 0, s_bram, true),
    (uid, 1, s_nyx, true),
    (uid, 2, s_luma, true),
    (uid, 3, s_kiro, false),
    (uid, 4, null, false),
    (uid, 5, null, false);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
