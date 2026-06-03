import type { CombatState, RunRewardDef, RunShopOffer } from "./types";
import { getRunWaveKind, type RunWaveKind } from "./run-waves";
import { grantXp } from "./xp";
import {
  RUN_START_BALLS,
  TRIBAL_BALL_INFO,
  pickRandomTribalBall,
  type TribalBallId,
} from "./phantoballs";

export { RUN_START_BALLS } from "./phantoballs";
export const RUN_START_GOLD = 100;
export const SHOP_REROLL_BASE = 12;

/** Or gagné en clearing une vague — courbe douce vagues 1→50+ */
export function waveClearGold(wave: number, kind: RunWaveKind = getRunWaveKind(wave)): number {
  let base = 12 + Math.floor(wave * 0.45);
  if (wave <= 3) base += 4;
  if (kind === "boss") return base + 22;
  if (kind === "mega_boss") return base + 42;
  if (kind === "final_boss") return base + 55;
  return base;
}

/** Prix reroll boutique entre vagues */
export function getShopRerollPrice(wave: number, rerollCount: number): number {
  return SHOP_REROLL_BASE + Math.floor(wave / 6) * 2 + rerollCount * 8;
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
  {
    id: "ball_pack",
    name: "Lot Phantoballs",
    emoji: "🔵",
    description: "+3 Phantoballs standard (consommables)",
    kind: "ball_standard",
    value: 3,
    stackable: true,
  },
  {
    id: "ball_tribal_random",
    name: "Ball tribale aléatoire",
    emoji: "🎲",
    description: "+1 ball tribale (type aléatoire) — bonus si tribu compatible",
    kind: "ball_tribal",
    value: 1,
    stackable: true,
  },
  {
    id: "ball_lumi",
    name: "Lumiball",
    emoji: "🟡",
    description: "+1 Lumiball — Mignons & Bienveillants ×1,5",
    kind: "ball_tribal",
    tribalBall: "lumi",
    value: 1,
    stackable: true,
  },
  {
    id: "ball_flam",
    name: "Flamball",
    emoji: "🔴",
    description: "+1 Flamball — Vaillants & Costauds ×2",
    kind: "ball_tribal",
    tribalBall: "flam",
    value: 1,
    stackable: true,
  },
  {
    id: "ball_ombra",
    name: "Ombraball",
    emoji: "🟣",
    description: "+1 Ombraball — Sombres & Sinistres ×2",
    kind: "ball_tribal",
    tribalBall: "ombra",
    value: 1,
    stackable: true,
  },
  {
    id: "ball_neant",
    name: "Néantball",
    emoji: "⚫",
    description: "+1 Néantball — Néants ×2,5",
    kind: "ball_tribal",
    tribalBall: "neant",
    value: 1,
    stackable: true,
  },
  {
    id: "eclat_xp",
    name: "Éclat d'expérience",
    emoji: "💠",
    description: "+35 XP pour toute la roue",
    kind: "xp_all",
    value: 35,
    stackable: true,
  },
  {
    id: "grande_eclat_xp",
    name: "Grande étincelle",
    emoji: "🔷",
    description: "+75 XP pour toute la roue",
    kind: "xp_all",
    value: 75,
    stackable: true,
  },
  {
    id: "offrande_vit",
    name: "Offrande du vent",
    emoji: "🍃",
    description: "+3 VIT sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "vit",
    value: 3,
  },
  {
    id: "relique_ame",
    name: "Fragment d'âme",
    emoji: "💫",
    description: "Un allié sur le terrain gagne 80 % de jauge d'âmes",
    kind: "soul_fill",
    value: 0.8,
  },
  {
    id: "prisme_amultime",
    name: "Prisme d'amultime",
    emoji: "🔮",
    description: "+28 % dégâts des amultimes (cumulable)",
    kind: "special_mult",
    value: 0.28,
    stackable: true,
  },
  {
    id: "resonance_ames",
    name: "Résonance d'âmes",
    emoji: "🌊",
    description: "Jauges d'âmes +45 % de remplissage (cumulable)",
    kind: "soul_mult",
    value: 0.45,
    stackable: true,
  },
  {
    id: "forteresse_vivante",
    name: "Forteresse vivante",
    emoji: "🏰",
    description: "+10 ATK et +10 DEF sur toute la roue",
    kind: "combo_atk_def",
    value: 10,
  },
  {
    id: "marque_traqueur",
    name: "Marque du traqueur",
    emoji: "🎯",
    description: "+15 % chance de capture (cumulable)",
    kind: "capture_bonus",
    value: 0.15,
    stackable: true,
  },
  {
    id: "focus_mystique",
    name: "Focus mystique",
    emoji: "✴️",
    description: "+22 % dégâts des amultimes (cumulable)",
    kind: "special_mult",
    value: 0.22,
    stackable: true,
  },
  {
    id: "tourbillon_ames",
    name: "Tourbillon d'âmes",
    emoji: "🌀",
    description: "Jauges d'âmes +35 % de remplissage (cumulable)",
    kind: "soul_mult",
    value: 0.35,
    stackable: true,
  },
  {
    id: "rempart_fer",
    name: "Rempart de fer",
    emoji: "🛡️",
    description: "+9 DEF sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "def",
    value: 9,
  },
  {
    id: "griffe_titan",
    name: "Griffe du titan",
    emoji: "⚔️",
    description: "+12 ATK sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "atk",
    value: 12,
  },
  {
    id: "pulse_vit",
    name: "Pulse vitale",
    emoji: "⚡",
    description: "+4 VIT sur toute la roue pour ce run",
    kind: "stat_all",
    stat: "vit",
    value: 4,
  },
  {
    id: "alliance_tribale",
    name: "Alliance tribale",
    emoji: "🤝",
    description: "+6 ATK et +6 DEF (cumulable)",
    kind: "combo_atk_def",
    value: 6,
    stackable: true,
  },
  {
    id: "filet_spectral",
    name: "Filet spectral",
    emoji: "🕸️",
    description: "+18 % chance de capture (cumulable)",
    kind: "capture_bonus",
    value: 0.18,
    stackable: true,
  },
];

let rewardPoolOverride: RunRewardDef[] | null = null;

export function setRunRewardPool(pool: RunRewardDef[]): void {
  rewardPoolOverride = pool;
}

export function resetRunRewardPool(): void {
  rewardPoolOverride = null;
}

export function getRunRewardPool(): RunRewardDef[] {
  return rewardPoolOverride ?? RUN_REWARD_POOL;
}

function rewardByIdMap(): Record<string, RunRewardDef> {
  return Object.fromEntries(getRunRewardPool().map((r) => [r.id, r])) as Record<string, RunRewardDef>;
}

export function getRunReward(id: string): RunRewardDef | undefined {
  return rewardByIdMap()[id];
}

/** Relique affichée dans la barre — effet actif pendant tout le run */
export function isPersistentRunRelic(reward: RunRewardDef | string): boolean {
  const def = typeof reward === "string" ? getRunReward(reward) : reward;
  if (!def) return false;
  return (
    def.kind === "stat_all" ||
    def.kind === "combo_atk_def" ||
    def.kind === "soul_mult" ||
    def.kind === "special_mult" ||
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
  let pool = getRunRewardPool().filter((r) => r.stackable || !owned.has(r.id));

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
    heal_all: 22,
    stat_all: 28,
    combo_atk_def: 42,
    soul_mult: 34,
    special_mult: 38,
    capture_bonus: 30,
    soul_fill: 16,
    ball_standard: 18,
    ball_tribal: 32,
    xp_all: 22,
  };
  let price = kindBase[reward.kind];
  if (reward.kind === "heal_all") price += Math.round(reward.value * 14);
  if (reward.kind === "stat_all") price += Math.floor(reward.value * 0.85);
  if (reward.kind === "ball_standard") price += (reward.value - 1) * 4;
  if (reward.kind === "xp_all") price += Math.floor(reward.value * 0.35);
  price += Math.floor(wave / 10) * 3;
  if (wave <= 5 && reward.kind !== "ball_tribal") price = Math.max(14, price - 4);
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
  const pool = getRunRewardPool().filter((r) => canOfferInShop(r, ownedIds));
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

    case "special_mult":
      state.runModifiers.specialPowerMult += reward.value;
      return `${reward.name} — amultimes renforcées`;

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

    case "ball_standard":
      state.runBalls.standard += reward.value;
      return `${reward.name} — +${reward.value} Phantoball(s)`;

    case "ball_tribal": {
      const ballId: TribalBallId = reward.tribalBall ?? pickRandomTribalBall(rng);
      state.runBalls.tribal[ballId] = (state.runBalls.tribal[ballId] ?? 0) + reward.value;
      const info = TRIBAL_BALL_INFO[ballId];
      return `${reward.name} — +${reward.value} ${info.name}`;
    }

    case "xp_all": {
      const allies = state.combatants.filter((c) => c.side === "ally" && !c.ko);
      if (allies.length === 0) return `${reward.name} — personne sur la roue`;
      for (const a of allies) grantXp(a, reward.value);
      return `${reward.name} — +${reward.value} XP toute la roue`;
    }

    default:
      return reward.name;
  }
}
