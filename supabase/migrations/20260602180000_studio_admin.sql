-- Studio dev : rôle admin + écriture hub_events

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_game_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create policy "hub_events_admin_insert"
  on public.hub_events
  for insert
  to authenticated
  with check (public.is_game_admin());

create policy "hub_events_admin_update"
  on public.hub_events
  for update
  to authenticated
  using (public.is_game_admin())
  with check (public.is_game_admin());

create policy "hub_events_admin_delete"
  on public.hub_events
  for delete
  to authenticated
  using (public.is_game_admin());
