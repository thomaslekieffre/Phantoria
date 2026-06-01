-- Terrain = emplacements visuels devant (slot_index 0, 1, 5)
update public.roster_slots
set on_field = (spirit_id is not null and slot_index in (0, 1, 5));
