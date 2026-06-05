-- Portrait custom par esprit (hub_id) — PNG/WebP dans public/

alter table public.spirit_templates
  add column if not exists portrait_url text;

comment on column public.spirit_templates.portrait_url is 'URL publique du portrait (ex. /assets/spirits/portraits/roche.png).';
