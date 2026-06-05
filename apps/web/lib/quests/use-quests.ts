"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { rosterFieldReady } from "@/components/hub/roster";
import { usePlayer } from "@/components/providers/player-provider";
import { loadStorySave } from "@/lib/story/story-progress";
import {
  claimQuestLocal,
  loadQuestSave,
  recordDailyLogin,
} from "@/lib/quests/quest-progress";
import { claimQuestRemote } from "@/lib/quests/quest-client";
import {
  evaluateAllQuests,
  mainChainSummary,
  unclaimedCount,
  type QuestStatus,
} from "@/lib/quests/quest-state";
import { QUESTS } from "@/lib/quests/quests";

export function useQuests(opts?: { trackLogin?: boolean }) {
  const {
    spiritCount,
    runsCompleted,
    roster,
    storySave,
    questProgress,
    supabaseEnabled,
    user,
    refresh: refreshPlayer,
  } = usePlayer();
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimSuccessTick, setClaimSuccessTick] = useState(0);
  const [lastClaimLabel, setLastClaimLabel] = useState("");

  const loggedIn = supabaseEnabled && Boolean(user);
  const useRemote = loggedIn;

  useEffect(() => {
    if (opts?.trackLogin) recordDailyLogin();
    setHydrated(true);
    setTick((n) => n + 1);
  }, [opts?.trackLogin]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const statuses = useMemo((): QuestStatus[] => {
    void tick;
    const localSave = hydrated ? loadQuestSave() : { claimed: [] as string[], daily: { login: false, storyWin: false, runDone: false } };
    const claimed = useRemote ? questProgress.claimed : localSave.claimed;
    const daily = useRemote ? questProgress.daily : localSave.daily;
    const ctx = {
      spiritCount,
      fieldReady: rosterFieldReady(roster),
      runsCompleted,
      storySave: useRemote ? storySave : hydrated ? loadStorySave() : { levels: {} },
      daily: {
        login: daily.login,
        storyWin: daily.storyWin,
        runDone: daily.runDone,
      },
    };
    return evaluateAllQuests(QUESTS, ctx, claimed);
  }, [
    spiritCount,
    runsCompleted,
    roster,
    tick,
    hydrated,
    useRemote,
    questProgress,
    storySave,
  ]);

  const mainSummary = useMemo(() => mainChainSummary(statuses), [statuses]);
  const pendingRewards = useMemo(
    () => (hydrated ? unclaimedCount(statuses) : 0),
    [hydrated, statuses],
  );

  const handleClaim = useCallback(
    async (questId: string) => {
      setClaimError(null);
      setClaimingId(questId);

      const quest = QUESTS.find((q) => q.id === questId);

      if (useRemote) {
        const result = await claimQuestRemote(questId);
        if (result.error) {
          setClaimError(result.error);
          setClaimingId(null);
          return;
        }
        await refreshPlayer();
      } else {
        claimQuestLocal(questId);
      }

      if (quest) {
        setLastClaimLabel(quest.reward.label);
        setClaimSuccessTick((n) => n + 1);
      }

      setClaimingId(null);
      refresh();
    },
    [refresh, refreshPlayer, useRemote],
  );

  return {
    statuses,
    mainSummary,
    pendingRewards,
    hydrated,
    claim: handleClaim,
    refresh,
    claimError,
    claimingId,
    claimSuccessTick,
    lastClaimLabel,
  };
}
