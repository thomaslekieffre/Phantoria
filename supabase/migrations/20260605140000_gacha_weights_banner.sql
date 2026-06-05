-- Poids de drop par entrée pool + bannière visuelle (chemin public ex. /assets/gacha/banners/event.png)

alter table public.gacha_pool_entries
  add column if not exists weight int not null default 100
  check (weight > 0);

alter table public.gacha_pools
  add column if not exists banner_url text;

comment on column public.gacha_pool_entries.weight is 'Poids relatif dans la même rareté (100 = référence).';
comment on column public.gacha_pools.banner_url is 'URL publique de la bannière PNG/WebP (ex. /assets/gacha/banners/event-demo.png).';

-- E du pack standard : taux intra-rareté différenciés (après seed)
update public.gacha_pool_entries set weight = 100 where pool_id = 'standard' and hub_id = 'bram';
update public.gacha_pool_entries set weight = 130 where pool_id = 'standard' and hub_id = 'roche';
update public.gacha_pool_entries set weight = 90 where pool_id = 'standard' and hub_id = 'halo';
