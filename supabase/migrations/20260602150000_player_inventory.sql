-- Inventaire hub (Phantoballs, soins) — consommables mode histoire.

create table public.player_inventory (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  quantity int not null default 0 check (quantity >= 0),
  primary key (user_id, item_id)
);

create index player_inventory_user_idx on public.player_inventory (user_id);

alter table public.player_inventory enable row level security;

create policy "inventory select own" on public.player_inventory
  for select using (auth.uid() = user_id);

-- ─── Achat boutique hub ───
create or replace function public.purchase_shop_item(p_item_id text, p_qty int default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  prices jsonb := '{
    "ball_standard": 40,
    "ball_lumi": 65,
    "ball_flam": 65,
    "ball_ombra": 65,
    "ball_neant": 80,
    "heal_small": 55,
    "heal_medium": 95
  }'::jsonb;
  unit_price int;
  total_cost int;
  cur_gold int;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_item_id is null or length(trim(p_item_id)) = 0 then
    raise exception 'Objet invalide';
  end if;

  if p_qty is null or p_qty < 1 or p_qty > 99 then
    raise exception 'Quantité invalide';
  end if;

  unit_price := (prices ->> p_item_id)::int;
  if unit_price is null then
    raise exception 'Objet inconnu';
  end if;

  total_cost := unit_price * p_qty;

  select gold into cur_gold from public.player_currencies where user_id = uid for update;
  if cur_gold is null then
    raise exception 'Compte introuvable';
  end if;

  if cur_gold < total_cost then
    raise exception 'Or insuffisant';
  end if;

  update public.player_currencies
  set gold = gold - total_cost
  where user_id = uid;

  insert into public.player_inventory (user_id, item_id, quantity)
  values (uid, p_item_id, p_qty)
  on conflict (user_id, item_id) do update set
    quantity = public.player_inventory.quantity + excluded.quantity;

  return jsonb_build_object(
    'item_id', p_item_id,
    'quantity', (select quantity from public.player_inventory where user_id = uid and item_id = p_item_id),
    'gold', (select gold from public.player_currencies where user_id = uid)
  );
end;
$$;

revoke all on function public.purchase_shop_item(text, int) from public;
grant execute on function public.purchase_shop_item(text, int) to authenticated;

-- ─── Sync inventaire après combat histoire ───
create or replace function public.persist_player_inventory(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  item jsonb;
  iid text;
  qty int;
begin
  if uid is null then
    raise exception 'Non connecté';
  end if;

  if p_items is null or jsonb_typeof(p_items) != 'array' then
    raise exception 'Payload invalide';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    iid := trim(item->>'item_id');
    qty := (item->>'quantity')::int;

    if iid is null or length(iid) = 0 then
      continue;
    end if;

    if qty < 0 or qty > 999 then
      raise exception 'Quantité invalide pour %', iid;
    end if;

    if qty = 0 then
      delete from public.player_inventory where user_id = uid and item_id = iid;
    else
      insert into public.player_inventory (user_id, item_id, quantity)
      values (uid, iid, qty)
      on conflict (user_id, item_id) do update set quantity = excluded.quantity;
    end if;
  end loop;
end;
$$;

revoke all on function public.persist_player_inventory(jsonb) from public;
grant execute on function public.persist_player_inventory(jsonb) to authenticated;

-- Pack de départ pour comptes existants sans inventaire
insert into public.player_inventory (user_id, item_id, quantity)
select p.id, v.item_id, v.qty
from public.profiles p
cross join (
  values
    ('ball_standard', 5),
    ('heal_small', 2)
) as v(item_id, qty)
on conflict do nothing;
