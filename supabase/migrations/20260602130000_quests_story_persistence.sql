-- Progression histoire, quêtes (claims + quotidiennes), crédit récompenses

-- ─── Histoire ───
create table public.player_story_levels (
  user_id uuid not null references public.profiles (id) on delete cascade,
  level_id text not null,
  stars int not null default 0 check (stars between 0 and 3),
  cleared boolean not null default false,
  best_round int,
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

create index player_story_levels_user_idx on public.player_story_levels (user_id);

alter table public.player_story_levels enable row level security;

create policy "story_levels select own" on public.player_story_levels
  for select using (auth.uid() = user_id);

create policy "story_levels insert own" on public.player_story_levels
  for insert with check (auth.uid() = user_id);

create policy "story_levels update own" on public.player_story_levels
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Quêtes réclamées ───
create table public.player_quest_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);

alter table public.player_quest_claims enable row level security;

create policy "quest_claims select own" on public.player_quest_claims
  for select using (auth.uid() = user_id);

-- ─── Quêtes quotidiennes ───
create table public.player_quest_daily (
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_date date not null default (timezone('utc', now()))::date,
  login_done boolean not null default false,
  story_win boolean not null default false,
  run_done boolean not null default false,
  primary key (user_id, quest_date)
);

alter table public.player_quest_daily enable row level security;

create policy "quest_daily select own" on public.player_quest_daily
  for select using (auth.uid() = user_id);

-- ─── Victoire histoire ───
create or replace function public.record_story_victory(
  p_level_id text,
  p_stars int,
  p_round int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prev_stars int;
  prev_round int;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_level_id is null or length(trim(p_level_id)) = 0 then
    raise exception 'Niveau invalide';
  end if;

  if p_stars < 1 or p_stars > 3 then
    raise exception 'Étoiles invalides';
  end if;

  if p_round < 1 then
    raise exception 'Round invalide';
  end if;

  select stars, best_round into prev_stars, prev_round
  from public.player_story_levels
  where user_id = uid and level_id = p_level_id;

  insert into public.player_story_levels (user_id, level_id, stars, cleared, best_round)
  values (
    uid,
    p_level_id,
    p_stars,
    true,
    p_round
  )
  on conflict (user_id, level_id) do update set
    cleared = true,
    stars = greatest(public.player_story_levels.stars, excluded.stars),
    best_round = case
      when public.player_story_levels.best_round is null then excluded.best_round
      else least(public.player_story_levels.best_round, excluded.best_round)
    end,
    updated_at = now();

  -- Flag quotidien victoire histoire
  insert into public.player_quest_daily (user_id, quest_date, story_win)
  values (uid, (timezone('utc', now()))::date, true)
  on conflict (user_id, quest_date) do update set story_win = true;

  return jsonb_build_object(
    'level_id', p_level_id,
    'stars', (select stars from public.player_story_levels where user_id = uid and level_id = p_level_id),
    'cleared', true
  );
end;
$$;

revoke all on function public.record_story_victory(text, int, int) from public;
grant execute on function public.record_story_victory(text, int, int) to authenticated;

-- ─── Flag quotidien quête ───
create or replace function public.record_quest_daily_flag(p_flag text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  d date := (timezone('utc', now()))::date;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_flag not in ('login', 'story_win', 'run_done') then
    raise exception 'Flag invalide';
  end if;

  insert into public.player_quest_daily (user_id, quest_date)
  values (uid, d)
  on conflict (user_id, quest_date) do nothing;

  if p_flag = 'login' then
    update public.player_quest_daily set login_done = true where user_id = uid and quest_date = d;
  elsif p_flag = 'story_win' then
    update public.player_quest_daily set story_win = true where user_id = uid and quest_date = d;
  else
    update public.player_quest_daily set run_done = true where user_id = uid and quest_date = d;
  end if;
end;
$$;

revoke all on function public.record_quest_daily_flag(text) from public;
grant execute on function public.record_quest_daily_flag(text) to authenticated;

-- ─── Réclamer quête (monnaies + claim atomique) ───
create or replace function public.claim_quest_reward(
  p_quest_id text,
  p_gold int default 0,
  p_gems int default 0,
  p_tickets int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_quest_id is null or length(trim(p_quest_id)) = 0 then
    raise exception 'Quête invalide';
  end if;

  if p_gold < 0 or p_gems < 0 or p_tickets < 0 then
    raise exception 'Récompense invalide';
  end if;

  if exists (
    select 1 from public.player_quest_claims
    where user_id = uid and quest_id = p_quest_id
  ) then
    raise exception 'Quête déjà réclamée';
  end if;

  insert into public.player_quest_claims (user_id, quest_id) values (uid, p_quest_id);

  update public.player_currencies
  set
    gold = gold + coalesce(p_gold, 0),
    gems = gems + coalesce(p_gems, 0),
    tickets = tickets + coalesce(p_tickets, 0)
  where user_id = uid;

  return jsonb_build_object(
    'quest_id', p_quest_id,
    'gold', coalesce(p_gold, 0),
    'gems', coalesce(p_gems, 0),
    'tickets', coalesce(p_tickets, 0)
  );
end;
$$;

revoke all on function public.claim_quest_reward(text, int, int, int) from public;
grant execute on function public.claim_quest_reward(text, int, int, int) to authenticated;
