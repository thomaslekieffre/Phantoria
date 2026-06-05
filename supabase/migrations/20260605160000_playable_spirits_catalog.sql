-- Roche, Halo, Murmure, Brise : jouables (gacha) → kind catalog + hub_id

update public.spirit_templates set
  kind = 'catalog',
  hub_id = 'roche',
  name = 'Roche'
where template_key = 'roche_costaud';

update public.spirit_templates set
  kind = 'catalog',
  hub_id = 'halo',
  name = 'Halo'
where template_key = 'halo_bienveillant';

update public.spirit_templates set
  kind = 'catalog',
  hub_id = 'murmure',
  name = 'Murmure'
where template_key = 'murmure_sinistre';

update public.spirit_templates set
  kind = 'catalog',
  hub_id = 'brise',
  name = 'Brise'
where template_key = 'brise_insaisissable';
