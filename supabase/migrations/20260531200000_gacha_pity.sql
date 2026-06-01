-- Pity pack général + tirage standard

alter table public.profiles
  add column if not exists gacha_pity_standard int not null default 0;

comment on column public.profiles.gacha_pity_standard is
  'Pulls depuis le dernier S sur le pack général (hard pity à 100).';
