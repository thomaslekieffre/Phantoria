-- L’event seed ne doit plus masquer les events Studio en prod
update public.hub_events
set active = false
where id = 'lune-captures';
