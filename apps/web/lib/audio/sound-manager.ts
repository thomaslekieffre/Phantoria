import { AUDIO_FILE_BASE, SOUND_REGISTRY } from "./sounds";
import { playSynth } from "./synth";
import {
  AUDIO_STORAGE_KEY,
  DEFAULT_AUDIO_SETTINGS,
  type AudioSettings,
  type SoundChannel,
  type SoundId,
} from "./types";

const FILE_CACHE = new Map<SoundId, AudioBuffer | "missing">();

function loadSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_SETTINGS;
    return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function saveSettings(settings: AudioSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
}

function channelGain(settings: AudioSettings, channel: SoundChannel): number {
  if (settings.muted) return 0;
  if (channel === "ui") return settings.ui;
  if (channel === "music") return settings.music;
  return settings.sfx;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private settings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.settings = loadSettings();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  getSettings(): AudioSettings {
    return this.settings;
  }

  setMuted(muted: boolean) {
    this.settings = { ...this.settings, muted };
    saveSettings(this.settings);
    this.notify();
  }

  toggleMuted() {
    this.setMuted(!this.settings.muted);
  }

  setChannelVolume(channel: SoundChannel, value: number) {
    const v = Math.max(0, Math.min(1, value));
    if (channel === "ui") this.settings = { ...this.settings, ui: v };
    else if (channel === "music") this.settings = { ...this.settings, music: v };
    else this.settings = { ...this.settings, sfx: v };
    saveSettings(this.settings);
    this.notify();
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = this.ctx ?? new Ctx();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.unlocked = true;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    return this.ctx;
  }

  private async loadFile(id: SoundId): Promise<AudioBuffer | null> {
    const cached = FILE_CACHE.get(id);
    if (cached === "missing") return null;
    if (cached) return cached;

    const ctx = this.ensureContext();
    if (!ctx) return null;

    for (const ext of [".webm", ".mp3", ".ogg"]) {
      try {
        const res = await fetch(`${AUDIO_FILE_BASE}/${id}${ext}`);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const audio = await ctx.decodeAudioData(buf.slice(0));
        FILE_CACHE.set(id, audio);
        return audio;
      } catch {
        /* try next ext */
      }
    }

    FILE_CACHE.set(id, "missing");
    return null;
  }

  private playBuffer(buffer: AudioBuffer, master: number) {
    const ctx = this.ensureContext();
    if (!ctx || master <= 0) return;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = master;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  async play(id: SoundId, opts?: { volume?: number }): Promise<void> {
    if (typeof window === "undefined") return;
    if (!this.unlocked) await this.unlock();

    const def = SOUND_REGISTRY[id];
    const master =
      channelGain(this.settings, def.channel) * def.gain * (opts?.volume ?? 1);
    if (master <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();

    const file = await this.loadFile(id);
    if (file) {
      this.playBuffer(file, master);
      return;
    }

    playSynth(ctx, id, master);
  }
}

export const soundManager = new SoundManager();
