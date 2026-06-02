-- Récompense or hub à la victoire histoire (record_story_victory).

create or replace function public.story_gold_for_level(
  p_zone_id int,
  p_level_index int,
  p_stars int,
  p_first_clear boolean
)
returns int
language plpgsql
immutable
as $$
declare
  base_gold int;
  total int;
begin
  base_gold := 12 + p_level_index * 6 + greatest(0, p_zone_id - 1) * 30;
  if p_level_index in (5, 10, 15) then
    base_gold := floor(base_gold * 1.5);
  end if;
  total := base_gold + p_stars * 10;
  if p_first_clear then
    return total;
  end if;
  return greatest(8, floor(total * 0.3));
end;
$$;

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

  select stars, best_round into prev_stars, prev_round
  from public.player_story_levels
  where user_id = uid and level_id = p_level_id;

  first_clear := prev_stars is null;

  gold_grant := public.story_gold_for_level(zone_id, lvl_idx, p_stars, first_clear);

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

revoke all on function public.story_gold_for_level(int, int, int, boolean) from public;
grant execute on function public.story_gold_for_level(int, int, int, boolean) to authenticated;

revoke all on function public.record_story_victory(text, int, int) from public;
grant execute on function public.record_story_victory(text, int, int) to authenticated;
