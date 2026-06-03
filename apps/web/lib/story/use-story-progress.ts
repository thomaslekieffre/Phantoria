"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isStoryLevelUnlocked as isStoryLevelUnlockedCore, isStoryZoneUnlocked } from "@phantoria/game-core";
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
    (levelId: string, zoneId: number, index: number) =>
      isStoryLevelUnlockedCore(levelId, zoneId, index, save),
    [save],
  );

  const isZoneUnlocked = useCallback(
    (zoneId: number) => isStoryZoneUnlocked(zoneId, save),
    [save],
  );

  const starsTotal = useMemo(
    () => Object.values(save.levels).reduce((sum, l) => sum + (l.stars ?? 0), 0),
    [save],
  );

  return { refresh, getProgress, isUnlocked, isZoneUnlocked, starsTotal, save };
}
