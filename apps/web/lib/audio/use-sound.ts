"use client";

import { useCallback } from "react";
import { useAudio } from "@/components/providers/audio-provider";
import type { SoundId } from "./types";

export function useSound() {
  const { play, unlock } = useAudio();

  const click = useCallback(() => play("ui_click"), [play]);
  const confirm = useCallback(() => play("ui_confirm"), [play]);
  const error = useCallback(() => play("ui_error"), [play]);

  return { play, unlock, click, confirm, error };
}

export type { SoundId };
