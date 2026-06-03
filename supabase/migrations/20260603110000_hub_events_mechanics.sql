-- Events hub : mécaniques (capture boost, gacha bannière, …)

alter table public.hub_events
  add column if not exists kind text not null default 'banner'
    check (kind in ('banner', 'capture_boost', 'gacha_banner')),
  add column if not exists config jsonb not null default '{}',
  add column if not exists priority int not null default 0;

comment on column public.hub_events.kind is 'banner = affichage seul ; capture_boost ; gacha_banner';
comment on column public.hub_events.config is 'JSON selon kind — voir lib/hub/event-mechanics.ts';

-- Exemple : Lune des captures = bonus capture en run
update public.hub_events
set
  kind = 'capture_boost',
  config = '{"captureBonus": 0.12, "label": "Bonus capture +12 %"}'::jsonb,
  href = '/run'
where id = 'lune-captures';
