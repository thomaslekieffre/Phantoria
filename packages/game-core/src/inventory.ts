import {
  createEmptyTribalStock,
  type PhantoballType,
  type RunBallStock,
  TRIBAL_BALL_IDS,
  type TribalBallId,
} from "./phantoballs";

/** IDs d'objets hub (inventaire persistant, consommables histoire). */
export const INVENTORY_ITEM_IDS = [
  "ball_standard",
  "ball_lumi",
  "ball_flam",
  "ball_ombra",
  "ball_neant",
  "heal_small",
  "heal_medium",
] as const;

export type InventoryItemId = (typeof INVENTORY_ITEM_IDS)[number];

export type InventoryItemCategory = "ball" | "heal";

export type InventoryItemDef = {
  id: InventoryItemId;
  name: string;
  emoji: string;
  description: string;
  category: InventoryItemCategory;
  /** Prix boutique hub (or `player_currencies.gold`). */
  price: number;
  /** Soin : fraction des PV max (0–1). */
  healPct?: number;
  /** Ball : type moteur combat. */
  ballType?: PhantoballType;
};

export const INVENTORY_CATALOG: Record<InventoryItemId, InventoryItemDef> = {
  ball_standard: {
    id: "ball_standard",
    name: "Phantoball",
    emoji: "🔵",
    description: "Capture standard — ennemi ≤ 40 % PV",
    category: "ball",
    price: 40,
    ballType: "standard",
  },
  ball_lumi: {
    id: "ball_lumi",
    name: "Lumiball",
    emoji: "🟡",
    description: "Bonus Mignons & Bienveillants",
    category: "ball",
    price: 65,
    ballType: "lumi",
  },
  ball_flam: {
    id: "ball_flam",
    name: "Flamball",
    emoji: "🔴",
    description: "Bonus Vaillants & Costauds",
    category: "ball",
    price: 65,
    ballType: "flam",
  },
  ball_ombra: {
    id: "ball_ombra",
    name: "Ombraball",
    emoji: "🟣",
    description: "Bonus Sombres & Sinistres",
    category: "ball",
    price: 65,
    ballType: "ombra",
  },
  ball_neant: {
    id: "ball_neant",
    name: "Néantball",
    emoji: "⚫",
    description: "Bonus Néants",
    category: "ball",
    price: 80,
    ballType: "neant",
  },
  heal_small: {
    id: "heal_small",
    name: "Lanterne de soin",
    emoji: "🏮",
    description: "Restaure 35 % des PV max d'un allié",
    category: "heal",
    price: 55,
    healPct: 0.35,
  },
  heal_medium: {
    id: "heal_medium",
    name: "Lanterne braisée",
    emoji: "🔥",
    description: "Restaure 55 % des PV max d'un allié",
    category: "heal",
    price: 95,
    healPct: 0.55,
  },
};

export type PlayerInventory = Partial<Record<InventoryItemId, number>>;

/** Pack de départ hors ligne / nouveau compte. */
export const STARTER_INVENTORY: PlayerInventory = {
  ball_standard: 5,
  heal_small: 2,
};

const TRIBAL_ITEM_MAP: Partial<Record<TribalBallId, InventoryItemId>> = {
  lumi: "ball_lumi",
  flam: "ball_flam",
  ombra: "ball_ombra",
  neant: "ball_neant",
};

export function normalizeInventory(raw: PlayerInventory | null | undefined): PlayerInventory {
  const out: PlayerInventory = {};
  for (const id of INVENTORY_ITEM_IDS) {
    const q = raw?.[id];
    out[id] = typeof q === "number" && q >= 0 ? q : 0;
  }
  return out;
}

export function inventoryQty(inv: PlayerInventory, id: InventoryItemId): number {
  return Math.max(0, inv[id] ?? 0);
}

/** Inventaire hub → stock balls combat histoire. */
export function inventoryToRunBalls(inv: PlayerInventory): RunBallStock {
  const tribal = createEmptyTribalStock();
  for (const tid of TRIBAL_BALL_IDS) {
    const itemId = TRIBAL_ITEM_MAP[tid];
    if (itemId) tribal[tid] = inventoryQty(inv, itemId);
  }
  return {
    standard: inventoryQty(inv, "ball_standard"),
    tribal,
  };
}

/** Stock balls combat → quantités inventaire (balls uniquement). */
export function runBallsToInventory(stock: RunBallStock): PlayerInventory {
  const out: PlayerInventory = { ball_standard: Math.max(0, stock.standard) };
  for (const tid of TRIBAL_BALL_IDS) {
    const itemId = TRIBAL_ITEM_MAP[tid];
    const count = Math.max(0, stock.tribal[tid] ?? 0);
    if (itemId) out[itemId] = count;
  }
  return out;
}

export function healItemsFromInventory(
  inv: PlayerInventory,
): { heal_small: number; heal_medium: number } {
  return {
    heal_small: inventoryQty(inv, "heal_small"),
    heal_medium: inventoryQty(inv, "heal_medium"),
  };
}

export function getInventoryItem(id: InventoryItemId): InventoryItemDef {
  return INVENTORY_CATALOG[id];
}

export function shopItems(): InventoryItemDef[] {
  return INVENTORY_ITEM_IDS.map((id) => INVENTORY_CATALOG[id]);
}
