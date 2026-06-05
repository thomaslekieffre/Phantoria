export type SoundChannel = "ui" | "sfx" | "music";

export type SoundId =
  | "ui_click"
  | "ui_confirm"
  | "ui_error"
  | "gacha_tick"
  | "gacha_reveal_common"
  | "gacha_reveal_rare"
  | "gacha_reveal_s"
  | "battle_hit"
  | "capture_throw"
  | "capture_shake"
  | "capture_success"
  | "capture_fail"
  | "quest_claim"
  | "gold_gain";

export type SoundDefinition = {
  id: SoundId;
  channel: SoundChannel;
  /** Volume relatif 0–1 avant master channel */
  gain: number;
};

export type AudioSettings = {
  muted: boolean;
  ui: number;
  sfx: number;
  music: number;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  ui: 0.85,
  sfx: 0.9,
  music: 0.55,
};

export const AUDIO_STORAGE_KEY = "phantoria_audio_v1";
