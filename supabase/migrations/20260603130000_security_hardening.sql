-- Durcissement sécurité : admin, quêtes, histoire, runs actives

-- ─── 1. profiles.is_admin : lecture seule côté joueur ───
create or replace function public.guard_profile_admin_field()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.is_admin is distinct from old.is_admin then
    raise exception 'Modification admin interdite';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_admin_field on public.profiles;
create trigger guard_profile_admin_field
  before update on public.profiles
  for each row execute function public.guard_profile_admin_field();

-- ─── 2. player_story_levels : pas d''écriture directe client ───
drop policy if exists "story_levels insert own" on public.player_story_levels;
drop policy if exists "story_levels update own" on public.player_story_levels;

-- ─── 3. record_story_victory : déblocage séquentiel ───
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
  zone_id int;
  lvl_idx int;
  prev_level_id text;
  prev_zone_final text;
  first_clear boolean;
  gold_grant int;
  new_gold int;
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

  zone_id := split_part(p_level_id, '-', 1)::int;
  lvl_idx := split_part(p_level_id, '-', 2)::int;

  if lvl_idx < 1 or lvl_idx > 15 then
    raise exception 'Index de niveau invalide';
  end if;

  if zone_id > 1 then
    prev_zone_final := (zone_id - 1)::text || '-15';
    if not exists (
      select 1 from public.player_story_levels
      where user_id = uid and level_id = prev_zone_final and cleared = true
    ) then
      raise exception 'Zone précédente non terminée';
    end if;
  end if;

  if lvl_idx > 1 then
    prev_level_id := zone_id::text || '-' || (lvl_idx - 1)::text;
    if not exists (
      select 1 from public.player_story_levels
      where user_id = uid and level_id = prev_level_id and cleared = true
    ) then
      raise exception 'Niveau précédent non terminé';
    end if;
  end if;

  select stars, best_round into prev_stars, prev_round
  from public.player_story_levels
  where user_id = uid and level_id = p_level_id;

  first_clear := prev_stars is null;

  gold_grant := public.story_gold_for_level(zone_id, lvl_idx, p_stars, first_clear);

  insert into public.player_story_levels (user_id, level_id, stars, cleared, best_round)
  values (uid, p_level_id, p_stars, true, p_round)
  on conflict (user_id, level_id) do update set
    cleared = true,
    stars = greatest(public.player_story_levels.stars, excluded.stars),
    best_round = case
      when public.player_story_levels.best_round is null then excluded.best_round
      else least(public.player_story_levels.best_round, excluded.best_round)
    end,
    updated_at = now();

  if gold_grant > 0 then
    update public.player_currencies
    set gold = gold + gold_grant
    where user_id = uid;
  end if;

  select gold into new_gold from public.player_currencies where user_id = uid;

  insert into public.player_quest_daily (user_id, quest_date, story_win)
  values (uid, (timezone('utc', now()))::date, true)
  on conflict (user_id, quest_date) do update set story_win = true;

  return jsonb_build_object(
    'level_id', p_level_id,
    'stars', (select stars from public.player_story_levels where user_id = uid and level_id = p_level_id),
    'cleared', true,
    'gold_earned', gold_grant,
    'gold', coalesce(new_gold, 0)
  );
end;
$$;

-- ─── 4. Quêtes : récompenses fixes + vérif objectifs en SQL ───
create or replace function public.quest_rewards_for(p_quest_id text)
returns table (gold int, gems int, tickets int)
language plpgsql
immutable
as $$
begin
  case p_quest_id
    when 'main-1-spirit' then gold := 50; gems := 0; tickets := 0;
    when 'main-2-wheel' then gold := 75; gems := 0; tickets := 0;
    when 'main-3-story' then gold := 100; gems := 0; tickets := 0;
    when 'main-4-stars' then gold := 0; gems := 10; tickets := 0;
    when 'main-5-run' then gold := 0; gems := 0; tickets := 2;
    when 'daily-login' then gold := 25; gems := 0; tickets := 0;
    when 'daily-story' then gold := 40; gems := 0; tickets := 0;
    when 'daily-run' then gold := 0; gems := 0; tickets := 1;
    when 'side-stars-3' then gold := 0; gems := 15; tickets := 0;
    else return;
  end case;
  return next;
end;
$$;

create or replace function public.quest_objectives_met(p_uid uuid, p_quest_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d date := (timezone('utc', now()))::date;
  field_count int;
  spirit_count int;
  stars_11 int;
  stars_total int;
  runs int;
  daily record;
begin
  case p_quest_id
    when 'main-1-spirit' then
      select count(*)::int into spirit_count from public.player_spirits where user_id = p_uid;
      return spirit_count >= 1;
    when 'main-2-wheel' then
      select count(*)::int into field_count
      from public.roster_slots
      where user_id = p_uid
        and spirit_id is not null
        and slot_index in (0, 1, 5);
      return field_count >= 3;
    when 'main-3-story' then
      return exists (
        select 1 from public.player_story_levels
        where user_id = p_uid and level_id = '1-1' and cleared = true
      );
    when 'main-4-stars' then
      select coalesce(stars, 0) into stars_11
      from public.player_story_levels
      where user_id = p_uid and level_id = '1-1';
      return stars_11 >= 2;
    when 'main-5-run' then
      select coalesce(runs_completed, 0) into runs from public.profiles where id = p_uid;
      return runs >= 1;
    when 'daily-login' then
      select * into daily from public.player_quest_daily where user_id = p_uid and quest_date = d;
      return coalesce(daily.login_done, false);
    when 'daily-story' then
      select * into daily from public.player_quest_daily where user_id = p_uid and quest_date = d;
      return coalesce(daily.story_win, false);
    when 'daily-run' then
      select * into daily from public.player_quest_daily where user_id = p_uid and quest_date = d;
      return coalesce(daily.run_done, false);
    when 'side-stars-3' then
      select coalesce(sum(stars), 0)::int into stars_total
      from public.player_story_levels where user_id = p_uid;
      return stars_total >= 3;
    else
      return false;
  end case;
end;
$$;

drop function if exists public.claim_quest_reward(text, int, int, int);

create or replace function public.claim_quest_reward(p_quest_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r record;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_quest_id is null or length(trim(p_quest_id)) = 0 then
    raise exception 'Quête invalide';
  end if;

  select * into r from public.quest_rewards_for(p_quest_id);
  if not found then
    raise exception 'Quête inconnue';
  end if;

  if exists (
    select 1 from public.player_quest_claims
    where user_id = uid and quest_id = p_quest_id
  ) then
    raise exception 'Quête déjà réclamée';
  end if;

  if not public.quest_objectives_met(uid, p_quest_id) then
    raise exception 'Objectif non terminé';
  end if;

  insert into public.player_quest_claims (user_id, quest_id) values (uid, p_quest_id);

  update public.player_currencies
  set
    gold = gold + coalesce(r.gold, 0),
    gems = gems + coalesce(r.gems, 0),
    tickets = tickets + coalesce(r.tickets, 0)
  where user_id = uid;

  return jsonb_build_object(
    'quest_id', p_quest_id,
    'gold', coalesce(r.gold, 0),
    'gems', coalesce(r.gems, 0),
    'tickets', coalesce(r.tickets, 0)
  );
end;
$$;

revoke all on function public.claim_quest_reward(text) from public;
grant execute on function public.claim_quest_reward(text) to authenticated;

-- ─── 5. Flags quotidiens : login seulement via RPC directe ───
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

  if p_flag <> 'login' then
    raise exception 'Flag non autorisé';
  end if;

  insert into public.player_quest_daily (user_id, quest_date, login_done)
  values (uid, d, true)
  on conflict (user_id, quest_date) do update set login_done = true;
end;
$$;

-- ─── 6. active_runs : lecture seule + RPC d''écriture ───
drop policy if exists "runs own" on public.active_runs;

create policy "runs select own" on public.active_runs
  for select using (auth.uid() = user_id);

create or replace function public.upsert_active_run(p_state jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  phase text;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    raise exception 'État invalide';
  end if;

  phase := p_state->>'phase';
  if phase is null or phase not in ('fighting', 'reward_pick', 'won', 'lost') then
    raise exception 'Phase de run invalide';
  end if;

  if coalesce((p_state->>'wave')::int, 0) < 1 or coalesce((p_state->>'wave')::int, 0) > 200 then
    raise exception 'Vague invalide';
  end if;

  insert into public.active_runs (user_id, state_json, updated_at)
  values (uid, p_state, now())
  on conflict (user_id) do update set
    state_json = excluded.state_json,
    updated_at = now();
end;
$$;

create or replace function public.clear_active_run()
returns void
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
  delete from public.active_runs where user_id = uid;
end;
$$;

revoke all on function public.upsert_active_run(jsonb) from public;
grant execute on function public.upsert_active_run(jsonb) to authenticated;
revoke all on function public.clear_active_run() from public;
grant execute on function public.clear_active_run() to authenticated;

-- ─── 7. claim_run_meta_reward : anti-forge + flag run_done ───
create or replace function public.claim_run_meta_reward(p_wave int, p_outcome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  st jsonb;
  phase text;
  run_wave int;
  t int := 0;
  g int := 0;
  tickets_from_waves int;
  gems_from_waves int;
  event_count int;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_outcome not in ('won', 'lost') then
    raise exception 'Résultat invalide';
  end if;

  if p_wave < 1 or p_wave > 200 then
    raise exception 'Vague invalide';
  end if;

  select state_json into st
  from public.active_runs
  where user_id = uid;

  if st is null then
    raise exception 'Aucune run active à clôturer';
  end if;

  phase := st->>'phase';
  run_wave := (st->>'wave')::int;

  if phase is distinct from p_outcome then
    raise exception 'État de run invalide';
  end if;

  if run_wave is distinct from p_wave then
    raise exception 'Vague incohérente';
  end if;

  if coalesce(jsonb_array_length(st->'combatants'), 0) < 2 then
    raise exception 'État de run non crédible';
  end if;

  event_count := coalesce(jsonb_array_length(st->'events'), 0);
  if event_count < greatest(1, p_wave / 25) then
    raise exception 'Historique de combat insuffisant';
  end if;

  tickets_from_waves := p_wave / 30;
  gems_from_waves := p_wave / 40;

  if p_outcome = 'won' then
    t := tickets_from_waves + 1;
    g := gems_from_waves + 5;
    if p_wave >= 50 then
      t := t + 1;
    end if;
    if p_wave >= 200 then
      t := t + 2;
      g := g + 20;
    end if;
  else
    t := tickets_from_waves;
    g := gems_from_waves;
  end if;

  update public.player_currencies
  set tickets = tickets + t, gems = gems + g
  where user_id = uid;

  update public.profiles
  set runs_completed = runs_completed + 1
  where id = uid;

  insert into public.player_quest_daily (user_id, quest_date, run_done)
  values (uid, (timezone('utc', now()))::date, true)
  on conflict (user_id, quest_date) do update set run_done = true;

  delete from public.active_runs where user_id = uid;

  return jsonb_build_object('tickets', t, 'gems', g);
end;
$$;
