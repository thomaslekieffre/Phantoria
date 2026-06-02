"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlayer } from "@/components/providers/player-provider";
import { loadStorySave, type StorySave } from "@/lib/story/story-progress";

const EMPTY: StorySave = { levels: {} };

/** Progression histoire — DB si connecté, sinon localStorage. */
export function useStoryProgress() {
  const { storySave, supabaseEnabled, user } = usePlayer();
  const useRemote = supabaseEnabled && Boolean(user);
  const [localSave, setLocalSave] = useState<StorySave>(EMPTY);

  useEffect(() => {
    if (!useRemote) {
      setLocalSave(loadStorySave());
    }
  }, [useRemote]);

  const save = useRemote ? storySave : localSave;

  const refresh = useCallback(() => {
    if (!useRemote) setLocalSave(loadStorySave());
  }, [useRemote]);

  const getProgress = useCallback(
    (levelId: string) => save.levels[levelId] ?? null,
    [save],
  );

  const isUnlocked = useCallback(
    (_levelId: string, zoneId: number, index: number) => {
      if (index <= 1) return true;
      const prevId = `${zoneId}-${index - 1}`;
      return Boolean(save.levels[prevId]?.cleared);
    },
    [save],
  );

  const starsTotal = useMemo(
    () => Object.values(save.levels).reduce((sum, l) => sum + (l.stars ?? 0), 0),
    [save],
  );

  return { refresh, getProgress, isUnlocked, starsTotal, save };
}
