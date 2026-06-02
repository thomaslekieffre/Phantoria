const QUEST_KEY = "phantoria_quests_v1";

import { isSupabaseEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { recordQuestDailyRemote } from "@/lib/quests/quest-client";

export type DailyQuestFlags = {
  login: boolean;
  storyWin: boolean;
  runDone: boolean;
};

type QuestSave = {
  claimed: string[];
  daily: { date: string } & DailyQuestFlags;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDaily(): QuestSave["daily"] {
  return { date: todayKey(), login: false, storyWin: false, runDone: false };
}

function emptySave(): QuestSave {
  return { claimed: [], daily: emptyDaily() };
}

function normalizeSave(raw: QuestSave): QuestSave {
  const save = raw?.claimed ? raw : emptySave();
  if (save.daily?.date !== todayKey()) {
    save.daily = emptyDaily();
  }
  return save;
}

export function loadQuestSave(): QuestSave {
  if (typeof window === "undefined") return emptySave();
  try {
    const raw = localStorage.getItem(QUEST_KEY);
    if (!raw) return emptySave();
    return normalizeSave(JSON.parse(raw) as QuestSave);
  } catch {
    return emptySave();
  }
}

function persist(save: QuestSave) {
  if (typeof window !== "undefined") {
    localStorage.setItem(QUEST_KEY, JSON.stringify(save));
  }
}

export function getDailyFlags(): DailyQuestFlags {
  const { daily } = loadQuestSave();
  return { login: daily.login, storyWin: daily.storyWin, runDone: daily.runDone };
}

export function isQuestClaimed(questId: string): boolean {
  return loadQuestSave().claimed.includes(questId);
}

export function claimQuestLocal(questId: string): void {
  const save = loadQuestSave();
  if (!save.claimed.includes(questId)) {
    save.claimed.push(questId);
    persist(save);
  }
}

async function pushDailyFlagRemote(flag: keyof DailyQuestFlags): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await recordQuestDailyRemote(flag);
}

export function recordDailyLogin(): void {
  const save = loadQuestSave();
  save.daily.login = true;
  persist(save);
  void pushDailyFlagRemote("login");
}

export function recordDailyStoryWin(): void {
  const save = loadQuestSave();
  save.daily.storyWin = true;
  persist(save);
  void pushDailyFlagRemote("storyWin");
}

export function recordDailyRun(): void {
  const save = loadQuestSave();
  save.daily.runDone = true;
  persist(save);
  void pushDailyFlagRemote("runDone");
}
