"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStorySave, type StorySave } from "@/lib/story/story-progress";

const EMPTY: StorySave = { levels: {} };

/** Progression locale — état initial vide pour matcher le SSR, puis sync au mount. */
export function useStoryProgress() {
  const [save, setSave] = useState<StorySave>(EMPTY);

  useEffect(() => {
    setSave(loadStorySave());
  }, []);

  const refresh = useCallback(() => {
    setSave(loadStorySave());
  }, []);

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

  return { refresh, getProgress, isUnlocked, starsTotal };
}
