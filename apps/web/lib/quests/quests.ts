/** Quêtes v0 — config locale (pas encore en DB). */

export type QuestReward = {
  label: string;
  gold?: number;
  gems?: number;
  tickets?: number;
};

export type QuestKind =
  | { type: "spirits_owned"; count: number }
  | { type: "field_ready" }
  | { type: "story_clear"; levelId: string }
  | { type: "story_stars_level"; levelId: string; stars: number }
  | { type: "runs_completed"; count: number }
  | { type: "story_stars_total"; count: number }
  | { type: "daily_flag"; flag: "login" | "storyWin" | "runDone" };

export type QuestDef = {
  id: string;
  chainId?: string;
  chainTitle?: string;
  title: string;
  description: string;
  kind: QuestKind;
  reward: QuestReward;
  href?: string;
  category: "main" | "daily" | "side";
};

export const MAIN_QUEST_CHAIN_ID = "main-intro";

export const QUESTS: QuestDef[] = [
  {
    id: "main-1-spirit",
    chainId: MAIN_QUEST_CHAIN_ID,
    chainTitle: "Premiers pas dans le néant",
    title: "Premier écho",
    description: "Invoque au moins un esprit au gacha.",
    kind: { type: "spirits_owned", count: 1 },
    reward: { label: "50 or", gold: 50 },
    href: "/gacha",
    category: "main",
  },
  {
    id: "main-2-wheel",
    chainId: MAIN_QUEST_CHAIN_ID,
    chainTitle: "Premiers pas dans le néant",
    title: "Roue prête",
    description: "Place 3 esprits devant sur la roue du sanctuaire.",
    kind: { type: "field_ready" },
    reward: { label: "75 or", gold: 75 },
    href: "/",
    category: "main",
  },
  {
    id: "main-3-story",
    chainId: MAIN_QUEST_CHAIN_ID,
    chainTitle: "Premiers pas dans le néant",
    title: "Premiers pas",
    description: "Termine le niveau histoire 1-1.",
    kind: { type: "story_clear", levelId: "1-1" },
    reward: { label: "100 or", gold: 100 },
    href: "/story/1/1",
    category: "main",
  },
  {
    id: "main-4-stars",
    chainId: MAIN_QUEST_CHAIN_ID,
    chainTitle: "Premiers pas dans le néant",
    title: "Sans casse",
    description: "Obtiens 2★ ou plus sur le niveau 1-1 (aucun KO).",
    kind: { type: "story_stars_level", levelId: "1-1", stars: 2 },
    reward: { label: "10 gemmes", gems: 10 },
    href: "/story/1/1",
    category: "main",
  },
  {
    id: "main-5-run",
    chainId: MAIN_QUEST_CHAIN_ID,
    chainTitle: "Premiers pas dans le néant",
    title: "Dans la brume",
    description: "Termine une run roguelite (victoire ou défaite).",
    kind: { type: "runs_completed", count: 1 },
    reward: { label: "2 tickets", tickets: 2 },
    href: "/run",
    category: "main",
  },
  {
    id: "daily-login",
    title: "Veille du sanctuaire",
    description: "Visite le camp aujourd'hui.",
    kind: { type: "daily_flag", flag: "login" },
    reward: { label: "25 or", gold: 25 },
    category: "daily",
  },
  {
    id: "daily-story",
    title: "Ligne de front",
    description: "Remporte un combat en mode histoire aujourd'hui.",
    kind: { type: "daily_flag", flag: "storyWin" },
    reward: { label: "40 or", gold: 40 },
    href: "/story",
    category: "daily",
  },
  {
    id: "daily-run",
    title: "Traversée du néant",
    description: "Termine une run aujourd'hui.",
    kind: { type: "daily_flag", flag: "runDone" },
    reward: { label: "1 ticket", tickets: 1 },
    href: "/run",
    category: "daily",
  },
  {
    id: "side-stars-3",
    title: "Éclat naissant",
    description: "Cumule 3 étoiles en mode histoire.",
    kind: { type: "story_stars_total", count: 3 },
    reward: { label: "15 gemmes", gems: 15 },
    href: "/story",
    category: "side",
  },
];

export function getQuestById(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function questsByCategory(category: QuestDef["category"]): QuestDef[] {
  return QUESTS.filter((q) => q.category === category);
}

export function mainChainQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.chainId === MAIN_QUEST_CHAIN_ID);
}
