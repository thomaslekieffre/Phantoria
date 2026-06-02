import type {
  InventoryItemId,
  PlayerInventory,
} from "@phantoria/game-core";
import {
  INVENTORY_CATALOG,
  INVENTORY_ITEM_IDS,
  STARTER_INVENTORY,
  normalizeInventory,
} from "@phantoria/game-core";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";

const LOCAL_INVENTORY_KEY = "phantoria_inventory_local";

export function loadLocalInventory(): PlayerInventory {
  if (typeof window === "undefined") return { ...STARTER_INVENTORY };
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_KEY);
    if (!raw) return { ...STARTER_INVENTORY };
    return normalizeInventory(JSON.parse(raw) as PlayerInventory);
  } catch {
    return { ...STARTER_INVENTORY };
  }
}

export function saveLocalInventory(inv: PlayerInventory): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(inv));
}

function rowsToInventory(
  rows: { item_id: string; quantity: number }[],
): PlayerInventory {
  const out: PlayerInventory = {};
  for (const row of rows) {
    if (INVENTORY_ITEM_IDS.includes(row.item_id as InventoryItemId)) {
      out[row.item_id as InventoryItemId] = row.quantity;
    }
  }
  return normalizeInventory(out);
}

export async function fetchPlayerInventoryFromDb(userId: string): Promise<PlayerInventory> {
  const supabase = createClient();
  const { data } = await supabase
    .from("player_inventory")
    .select("item_id, quantity")
    .eq("user_id", userId);

  if (!data?.length) return { ...STARTER_INVENTORY };
  return rowsToInventory(data);
}

export async function persistPlayerInventory(inv: PlayerInventory): Promise<void> {
  const normalized = normalizeInventory(inv);

  if (!isSupabaseEnabled()) {
    saveLocalInventory(normalized);
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    saveLocalInventory(normalized);
    return;
  }

  const payload = INVENTORY_ITEM_IDS.map((item_id) => ({
    item_id,
    quantity: normalized[item_id] ?? 0,
  }));

  const { error } = await supabase.rpc("persist_player_inventory", { p_items: payload });
  if (error) throw new Error(error.message);
}

export async function purchaseShopItem(
  itemId: InventoryItemId,
  qty = 1,
): Promise<{ gold: number; quantity: number }> {
  if (!isSupabaseEnabled()) {
    const inv = loadLocalInventory();
    const def = INVENTORY_CATALOG[itemId];
    inv[itemId] = (inv[itemId] ?? 0) + qty;
    saveLocalInventory(inv);
    return { gold: 0, quantity: inv[itemId] ?? 0 };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("purchase_shop_item", {
    p_item_id: itemId,
    p_qty: qty,
  });
  if (error) throw new Error(error.message);
  const row = data as { gold?: number; quantity?: number };
  return { gold: row.gold ?? 0, quantity: row.quantity ?? 0 };
}

/** Fusionne inventaire de départ, balls restantes et soins après combat histoire. */
export function mergeStoryInventoryEnd(
  base: PlayerInventory,
  ballUpdates: PlayerInventory,
  heals: Pick<PlayerInventory, "heal_small" | "heal_medium">,
): PlayerInventory {
  return normalizeInventory({
    ...base,
    ...ballUpdates,
    heal_small: heals.heal_small ?? 0,
    heal_medium: heals.heal_medium ?? 0,
  });
}
