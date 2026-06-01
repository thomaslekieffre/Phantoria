-- Passe les tirages de bienvenue à 6 (roue ×6)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := new.id;
  i int;
begin
  insert into public.profiles (id, display_name, welcome_pulls_remaining)
  values (
    uid,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Esprit'),
    6
  );

  insert into public.player_currencies (user_id, gold, gems, tickets)
  values (uid, 0, 0, 0);

  for i in 0..5 loop
    insert into public.roster_slots (user_id, slot_index, spirit_id, on_field)
    values (uid, i, null, false);
  end loop;

  return new;
end;
$$;

comment on column public.profiles.welcome_pulls_remaining is
  'Invocations gratuites (bannière bienvenue). 6 à la création — une par slot de roue.';
