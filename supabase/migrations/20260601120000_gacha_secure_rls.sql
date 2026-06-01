-- Invocations gacha : lecture seule côté client ; écritures via service role (API Next).

drop policy if exists "currencies own" on public.player_currencies;
drop policy if exists "spirits own" on public.player_spirits;

create policy "currencies select own" on public.player_currencies
  for select using (auth.uid() = user_id);

create policy "spirits select own" on public.player_spirits
  for select using (auth.uid() = user_id);

-- Bloque la triche sur pity / pulls bienvenue depuis le client anon/authenticated.
create or replace function public.guard_profile_gacha_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.role() = 'authenticated'
     and (
       new.welcome_pulls_remaining is distinct from old.welcome_pulls_remaining
       or new.gacha_pity_standard is distinct from old.gacha_pity_standard
     ) then
    raise exception 'Modification gacha interdite';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_gacha_fields on public.profiles;
create trigger guard_profile_gacha_fields
  before update on public.profiles
  for each row execute function public.guard_profile_gacha_fields();
