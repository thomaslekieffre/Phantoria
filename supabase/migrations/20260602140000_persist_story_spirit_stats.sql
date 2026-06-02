-- Persistance niveau / XP / PV histoire (client en lecture seule sur player_spirits depuis gacha RLS).

create or replace function public.persist_story_spirit_stats(p_updates jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  hub text;
  lvl int;
  xp_val int;
  hp int;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_updates is null or jsonb_typeof(p_updates) != 'array' then
    raise exception 'Payload invalide';
  end if;

  for item in select * from jsonb_array_elements(p_updates)
  loop
    hub := trim(item->>'hub_id');
    lvl := (item->>'level')::int;
    xp_val := (item->>'xp')::int;
    hp := (item->>'hp_pct')::int;

    if hub is null or length(hub) = 0 then
      continue;
    end if;

    if lvl < 1 or lvl > 60 then
      raise exception 'Niveau invalide pour %', hub;
    end if;

    if xp_val < 0 then
      raise exception 'XP invalide pour %', hub;
    end if;

    if hp < 1 or hp > 100 then
      raise exception 'PV invalides pour %', hub;
    end if;

    update public.player_spirits
    set level = lvl, xp = xp_val, hp_pct = hp
    where user_id = uid and hub_id = hub;

    if not found then
      raise exception 'Esprit inconnu: %', hub;
    end if;
  end loop;
end;
$$;

revoke all on function public.persist_story_spirit_stats(jsonb) from public;
grant execute on function public.persist_story_spirit_stats(jsonb) to authenticated;
