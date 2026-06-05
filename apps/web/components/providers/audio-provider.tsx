"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { soundManager } from "@/lib/audio/sound-manager";
import type { AudioSettings, SoundChannel, SoundId } from "@/lib/audio/types";

type AudioContextValue = {
  settings: AudioSettings;
  play: (id: SoundId, opts?: { volume?: number }) => void;
  unlock: () => Promise<void>;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
  setChannelVolume: (channel: SoundChannel, value: number) => void;
};

const AudioCtx = createContext<AudioContextValue | null>(null);

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error("useAudio hors AudioProvider");
  return ctx;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(() => soundManager.getSettings());

  useEffect(() => soundManager.subscribe(() => setSettings(soundManager.getSettings())), []);

  useEffect(() => {
    function onPointerDown() {
      void soundManager.unlock();
    }
    window.addEventListener("pointerdown", onPointerDown, { once: false, passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const play = useCallback((id: SoundId, opts?: { volume?: number }) => {
    void soundManager.play(id, opts);
  }, []);

  const unlock = useCallback(() => soundManager.unlock(), []);

  const value = useMemo<AudioContextValue>(
    () => ({
      settings,
      play,
      unlock,
      toggleMuted: () => soundManager.toggleMuted(),
      setMuted: (m) => soundManager.setMuted(m),
      setChannelVolume: (ch, v) => soundManager.setChannelVolume(ch, v),
    }),
    [settings, play, unlock],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
