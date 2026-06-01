-- Compteur de runs roguelite terminées (hub)

alter table public.profiles
  add column if not exists runs_completed int not null default 0 check (runs_completed >= 0);

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
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_outcome not in ('won', 'lost') then
    raise exception 'Résultat invalide';
  end if;

  if p_wave < 1 then
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

  tickets_from_waves := p_wave / 5;
  gems_from_waves := p_wave / 20;

  if p_outcome = 'won' then
    t := tickets_from_waves + 3;
    g := gems_from_waves + 15;
    if p_wave >= 200 then
      t := t + 5;
      g := g + 25;
    end if;
  else
    t := greatest(1, tickets_from_waves);
    g := gems_from_waves;
  end if;

  update public.player_currencies
  set
    tickets = tickets + t,
    gems = gems + g
  where user_id = uid;

  update public.profiles
  set runs_completed = runs_completed + 1
  where id = uid;

  delete from public.active_runs where user_id = uid;

  return jsonb_build_object('tickets', t, 'gems', g);
end;
$$;
