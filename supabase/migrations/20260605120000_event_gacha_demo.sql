-- Event gacha démo (QA-004) — inactive par défaut, activer via Studio

insert into public.gacha_pools (id, ticket_cost, gem_cost, multi_count, active)
values ('event-demo', 1, 50, 10, true)
on conflict (id) do update set
  ticket_cost = excluded.ticket_cost,
  gem_cost = excluded.gem_cost,
  multi_count = excluded.multi_count,
  active = excluded.active;

-- Pool event : Aurore (S) + Brise + Murmure (à ajuster après seed esprits)
insert into public.gacha_pool_entries (pool_id, hub_id, template_key, name, tribe, hue, rarity, sort_order)
values
  ('event-demo', 'aurore', 'aurore_legende', 'Aurore', 'Bienveillants', '#fde047', 'S', 0),
  ('event-demo', 'brise', 'brise_insaisissable', 'Brise', 'Insaisissables', '#38bdf8', 'D', 1),
  ('event-demo', 'murmure', 'murmure_sinistre', 'Murmure', 'Sinistres', '#6b21a8', 'D', 2)
on conflict (pool_id, hub_id) do update set
  template_key = excluded.template_key,
  name = excluded.name,
  tribe = excluded.tribe,
  hue = excluded.hue,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order;

insert into public.hub_events (
  id,
  title,
  subtitle,
  href,
  active,
  starts_at,
  ends_at,
  kind,
  config,
  priority
)
values (
  'banniere-gacha-demo',
  'Bannière démo',
  'Pool event-demo — activer pour tester le gacha event',
  '/gacha',
  false,
  now() - interval '1 day',
  now() + interval '30 days',
  'gacha_banner',
  '{"poolId":"event-demo","ticketCost":1,"gemCost":50,"multiCount":10,"featuredHubIds":["aurore","brise"],"label":"Demo QA"}'::jsonb,
  20
)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  kind = excluded.kind,
  config = excluded.config,
  priority = excluded.priority;
