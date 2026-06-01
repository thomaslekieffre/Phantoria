-- Fix signup 500 : RETURNING sur multi-row INSERT cassait le trigger

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
