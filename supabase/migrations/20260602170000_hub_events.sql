-- Événements hub (bandeau sanctuaire)

create table if not exists public.hub_events (
  id text primary key,
  title text not null,
  subtitle text not null,
  href text not null default '/events',
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.hub_events enable row level security;

create policy "hub_events_read_all"
  on public.hub_events
  for select
  to anon, authenticated
  using (true);

insert into public.hub_events (id, title, subtitle, href, active)
values (
  'lune-captures',
  'Lune des captures',
  'Bonus capture en run — lance une partie',
  '/events',
  true
)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  href = excluded.href,
  active = excluded.active;
