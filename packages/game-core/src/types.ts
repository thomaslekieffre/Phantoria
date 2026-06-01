export const TRIBES = [
  "vaillants",
  "mysterieux",
  "costauds",
  "mignons",
  "bienveillants",
  "sombres",
  "sinistres",
  "insaisissables",
  "perfides",
  "enma",
  "neants",
] as const;

export type Tribe = (typeof TRIBES)[number];

export const RARITIES = ["E", "D", "C", "B", "A", "S"] as const;
export type Rarity = (typeof RARITIES)[number];

export const MAX_LEVEL_BY_RARITY: Record<Rarity, number> = {
  E: 20,
  D: 30,
  C: 40,
  B: 60,
  A: 80,
  S: 100,
};

export const CAPTURE_RATE_BY_RARITY: Record<Rarity, number> = {
  S: 0.01,
  A: 0.05,
  B: 0.15,
  C: 0.35,
  D: 0.5,
  E: 0.7,
};

/** Plafond capture standard — jamais garantie à 100 % */
export const CAPTURE_MAX_CHANCE = 0.85;
export const CAPTURE_MIN_CHANCE = 0.05;

export type Targeting = "single" | "random" | "aoe";

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  vit: number;
}

export interface SkillTemplate {
  id: string;
  name: string;
  power: number;
  targeting: Targeting;
  tribe?: Tribe;
  /** Si absent, généré via describeSkill() */
  description?: string;
}

export interface CharacterTemplate {
  key: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  base: Stats;
  skills: {
    basic: SkillTemplate;
    special1: SkillTemplate;
    special2: SkillTemplate;
  };
}

export type Side = "ally" | "enemy";

export const MAX_WHEEL = 6;
export const MAX_FIELD = 3;
/** Arc du haut de la roue (face au combat) — slots 5, 0, 1 */
export const FIELD_WHEEL_INDICES: readonly number[] = [5, 0, 1];

export function isFieldWheelIndex(index: number): boolean {
  return (FIELD_WHEEL_INDICES as readonly number[]).includes(index);
}

export type WheelRotation = "cw" | "ccw";

export interface Combatant {
  instanceId: string;
  templateKey: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  side: Side;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  vit: number;
  /** Index 0–5 sur la roue (alliés uniquement) */
  wheelIndex: number;
  /** Sur le terrain (max 3 alliés) */
  active: boolean;
  ko: boolean;
  /** Jauge Âmes 0 → 1 */
  souls: number;
  /** XP run — montée de niveau */
  xp: number;
  skills: CharacterTemplate["skills"];
}

export type CombatPhase = "fighting" | "won" | "lost" | "reward_pick";

export type BattleMode = "run" | "story";

export type CombatEventKind =
  | "turn_start"
  | "attack"
  | "special"
  | "damage"
  | "ko"
  | "soul_gain"
  | "soul_ready"
  | "capture_attempt"
  | "capture_success"
  | "capture_fail"
  | "capture_pending"
  | "wave_end"
  | "wave_start"
  | "wheel_rotate"
  | "level_up";

export interface CombatEvent {
  id: number;
  kind: CombatEventKind;
  text: string;
  actorId?: string;
  targetId?: string;
  /** Dégâts ou valeur associée */
  amount?: number;
}

export type RunRewardKind =
  | "heal_all"
  | "stat_all"
  | "combo_atk_def"
  | "soul_mult"
  | "capture_bonus"
  | "soul_fill"
  | "ball_standard"
  | "ball_tribal"
  | "xp_all";

export type { RunBallStock, PhantoballType, TribalBallId } from "./phantoballs";
import type { TribalBallId } from "./phantoballs";

export interface RunRewardDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  kind: RunRewardKind;
  value: number;
  stat?: "atk" | "def" | "vit" | "maxHp";
  stackable?: boolean;
  /** Pour kind `ball_tribal` — type précis ; absent = aléatoire */
  tribalBall?: TribalBallId;
}

export interface RunModifiers {
  soulGainMult: number;
  captureBonus: number;
}

/** Offre boutique entre vagues */
export interface RunShopOffer {
  rewardId: string;
  price: number;
}

export interface CombatState {
  wave: number;
  round: number;
  combatants: Combatant[];
  /** File d'action (instanceIds vivants sur le terrain, tri VIT desc) */
  turnQueue: string[];
  queueIndex: number;
  phase: CombatPhase;
  /** Roguelite (défaut) ou histoire */
  battleMode?: BattleMode;
  /** Ex. `1-1` en mode histoire */
  storyLevelId?: string | null;
  events: CombatEvent[];
  /** Ennemi affaibli éligible à la capture */
  captureTargetId: string | null;
  /** Capture réussie — le joueur choisit un slot roue */
  pendingRecruit: PendingRecruit | null;
  /** Reliques / objets collectés ce run */
  runRelics: string[];
  /** Modificateurs passifs du run */
  runModifiers: RunModifiers;
  /** Choix entre vagues (3 objets gratuits) */
  rewardChoices: RunRewardDef[] | null;
  /** Récompense gratuite déjà prise ce palier */
  freeRewardPicked: boolean;
  /** Stock boutique entre vagues */
  shopOffers: RunShopOffer[] | null;
  /** Or du run (€) */
  runGold: number;
  /** Stock Phantoballs consommables ce run */
  runBalls: import("./phantoballs").RunBallStock;
  /** Rerolls boutique ce palier (prix croissant) */
  shopRerollCount: number;
  /** Ennemi marqué pour les attaques de base alliées — défaut = premier ennemi */
  attackFocusId: string | null;
}

/** Snapshot de l'esprit au moment de la capture — mêmes stats qu'en combat */
export interface PendingRecruit {
  templateKey: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  vit: number;
  xp: number;
}

export interface BattleResult {
  won: boolean;
  capturedKey: string | null;
}
