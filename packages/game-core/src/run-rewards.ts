import type { CombatState, RunRewardDef, RunShopOffer } from "./types";
import { getRunWaveKind, type RunWaveKind } from "./run-waves";

export const RUN_START_GOLD = 100;

/** Or gagné en clearing une vague */
export function waveClearGold(wave: number, kind: RunWaveKind = getRunWaveKind(wave)): number {
  const base = 10 + Math.floor(wave / 8);
  if (kind === "boss") return base + 18;
  if (kind === "mega_boss") return base + 35;
  if (kind === "final_boss") return base + 50;
  return base;
}

export const RUN_REWARD_POOL: RunRewardDef[] = [
  {
    id: "lanterne_soin",
    name: "Lanterne de soin",
    emoji: "🏮",
    description: "Toute la roue récupère 35 % des PV max",
    kind: "heal_all",
    value: 0.35,
  },
  {
    id: "griffe_ardente",
    name: "Griffe ardente",
    emoji: "🔥",
    description: "+8 ATK sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "atk",
    value: 8,
  },
  {
    id: "coquille_verte",
    name: "Coquille verte",
    emoji: "🛡️",
    description: "+6 DEF sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "def",
    value: 6,
  },
  {
    id: "veine_vita",
    name: "Veine vitale",
    emoji: "💚",
    description: "+20 PV max sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "maxHp",
    value: 20,
  },
  {
    id: "vent_vif",
    name: "Vent vif",
    emoji: "💨",
    description: "+2 VIT sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "vit",
    value: 2,
  },
  {
    id: "echo_ames",
    name: "Écho d'âmes",
    emoji: "✨",
    description: "Jauges d'âmes +30 % de remplissage (cumulable)",
    kind: "soul_mult",
    value: 0.3,
    stackable: true,
  },
  {
    id: "ball_acier",
    name: "Phantoball renforcée",
    emoji: "⚾",
    description: "+12 % chance de capture (cumulable)",
    kind: "capture_bonus",
    value: 0.12,
    stackable: true,
  },
  {
    id: "offrande",
    name: "Offrande du sanctuaire",
    emoji: "🪷",
    description: "Un esprit sur le terrain gagne 50 % de jauge d'âmes",
    kind: "soul_fill",
    value: 0.5,
  },
  {
    id: "filament",
    name: "Filament mycélien",
    emoji: "🍄",
    description: "+5 ATK et +5 DEF sur toute la roue",
    kind: "combo_atk_def",
    value: 5,
  },
  {
    id: "lanterne_ember",
    name: "Lanterne braise",
    emoji: "🕯️",
    description: "Toute la roue récupère 55 % des PV max",
    kind: "heal_all",
    value: 0.55,
  },
];

const REWARD_BY_ID = Object.fromEntries(RUN_REWARD_POOL.map((r) => [r.id, r])) as Record<
  string,
  RunRewardDef
>;

export function getRunReward(id: string): RunRewardDef | undefined {
  return REWARD_BY_ID[id];
}

/** Relique affichée dans la barre — effet actif pendant tout le run */
export function isPersistentRunRelic(reward: RunRewardDef | string): boolean {
  const def = typeof reward === "string" ? getRunReward(reward) : reward;
  if (!def) return false;
  return (
    def.kind === "stat_all" ||
    def.kind === "combo_atk_def" ||
    def.kind === "soul_mult" ||
    def.kind === "capture_bonus"
  );
}

export type RunRelicDisplay = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  count: number;
};

/** Reliques possédées — agrégées pour l'UI */
export function getRunRelicDisplay(relicIds: readonly string[]): RunRelicDisplay[] {
  const counts = new Map<string, number>();
  for (const id of relicIds) {
    if (!isPersistentRunRelic(id)) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([id, count]) => {
      const def = getRunReward(id);
      return def
        ? { id, name: def.name, emoji: def.emoji, description: def.description, count }
        : { id, name: id, emoji: "✦", description: "", count };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** 3 choix uniques — légèrement biaisé vers soin tôt run */
export function rollRewardChoices(
  wave: number,
  ownedIds: readonly string[],
  count = 3,
  rng: () => number = Math.random,
): RunRewardDef[] {
  const owned = new Set(ownedIds);
  let pool = RUN_REWARD_POOL.filter((r) => r.stackable || !owned.has(r.id));

  if (wave <= 2) {
    pool = [
      ...pool.filter((r) => r.kind === "heal_all"),
      ...pool.filter((r) => r.kind !== "heal_all"),
    ];
  }

  const picks: RunRewardDef[] = [];
  const bag = pool.slice();

  while (picks.length < count && bag.length > 0) {
    const idx = Math.floor(rng() * bag.length);
    picks.push(bag[idx]!);
    bag.splice(idx, 1);
  }

  return picks;
}

/** Prix boutique selon type d'objet et progression */
export function getShopPrice(reward: RunRewardDef, wave: number): number {
  const kindBase: Record<RunRewardDef["kind"], number> = {
    heal_all: 25,
    stat_all: 32,
    combo_atk_def: 48,
    soul_mult: 38,
    capture_bonus: 34,
    soul_fill: 18,
  };
  let price = kindBase[reward.kind];
  if (reward.kind === "heal_all") price += Math.round(reward.value * 18);
  if (reward.kind === "stat_all") price += reward.value;
  price += Math.floor(wave / 12) * 4;
  return price;
}

function canOfferInShop(reward: RunRewardDef, ownedIds: readonly string[]): boolean {
  if (reward.stackable) return true;
  return !ownedIds.includes(reward.id);
}

/** Stock boutique — objets distincts du pool, prix calculés */
export function rollShopOffers(
  wave: number,
  ownedIds: readonly string[],
  count = 5,
  rng: () => number = Math.random,
): RunShopOffer[] {
  const pool = RUN_REWARD_POOL.filter((r) => canOfferInShop(r, ownedIds));
  const bag = pool.slice();
  const offers: RunShopOffer[] = [];

  while (offers.length < count && bag.length > 0) {
    const idx = Math.floor(rng() * bag.length);
    const reward = bag[idx]!;
    bag.splice(idx, 1);
    offers.push({ rewardId: reward.id, price: getShopPrice(reward, wave) });
  }

  return offers.sort((a, b) => a.price - b.price);
}

export function applyRunReward(state: CombatState, reward: RunRewardDef, rng = Math.random): string {
  const allies = state.combatants.filter((c) => c.side === "ally" && !c.ko);

  switch (reward.kind) {
    case "heal_all":
      for (const a of allies) {
        const gain = Math.max(1, Math.floor(a.maxHp * reward.value));
        a.hp = Math.min(a.maxHp, a.hp + gain);
      }
      return `${reward.name} — la roue est soignée`;

    case "stat_all": {
      const stat = reward.stat!;
      for (const a of allies) {
        if (stat === "maxHp") {
          a.maxHp += reward.value;
          a.hp += reward.value;
        } else {
          a[stat] += reward.value;
        }
      }
      return `${reward.name} — stats renforcées`;
    }

    case "combo_atk_def":
      for (const a of allies) {
        a.atk += reward.value;
        a.def += reward.value;
      }
      return `${reward.name} — ATK et DEF augmentés`;

    case "soul_mult":
      state.runModifiers.soulGainMult += reward.value;
      return `${reward.name} — âmes accélérées`;

    case "capture_bonus":
      state.runModifiers.captureBonus += reward.value;
      return `${reward.name} — capture facilitée`;

    case "soul_fill": {
      const onField = allies.filter((a) => a.active);
      const pool = onField.length > 0 ? onField : allies;
      if (pool.length === 0) return `${reward.name} — personne sur le terrain`;
      const pick = pool[Math.floor(rng() * pool.length)]!;
      pick.souls = Math.min(1, pick.souls + reward.value);
      return `${reward.name} — ${pick.name} gagne des âmes`;
    }

    default:
      return reward.name;
  }
}
