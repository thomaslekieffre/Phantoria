"use client";

import { useAudio } from "@/components/providers/audio-provider";
import { useSound } from "@/lib/audio/use-sound";

export function SoundToggle() {
  const { settings, toggleMuted } = useAudio();
  const { click } = useSound();

  return (
    <button
      type="button"
      className="topbar__sound"
      aria-label={settings.muted ? "Activer le son" : "Couper le son"}
      aria-pressed={settings.muted}
      title={settings.muted ? "Son coupé" : "Son activé"}
      onClick={() => {
        click();
        toggleMuted();
      }}
    >
      {settings.muted ? <IconMuted /> : <IconSound />}
    </button>
  );
}

function IconSound() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="topbar__sound-ico">
      <path
        fill="currentColor"
        d="M11 5 6 9H3v6h3l5 4V5zm4.5 2.5a1 1 0 0 1 1.4 0 6 6 0 0 1 0 8.5 1 1 0 1 1-1.4-1.4 4 4 0 0 0 0-5.7 1 1 0 0 1 0-1.4zm3-3a1 1 0 0 1 1.4 0 10 10 0 0 1 0 14.1 1 1 0 1 1-1.4-1.4 8 8 0 0 0 0-11.3 1 1 0 0 1 0-1.4z"
      />
    </svg>
  );
}

function IconMuted() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="topbar__sound-ico">
      <path
        fill="currentColor"
        d="M11 5 6 9H3v6h3l5 4V5zm9.5 4.5-1.4 1.4L18 10.8l-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1z"
      />
    </svg>
  );
}
