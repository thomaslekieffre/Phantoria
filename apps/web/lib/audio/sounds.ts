import type { Rarity } from "@phantoria/game-core";
import type { SoundDefinition, SoundId } from "./types";

export const SOUND_REGISTRY: Record<SoundId, SoundDefinition> = {
  ui_click: { id: "ui_click", channel: "ui", gain: 0.35 },
  ui_confirm: { id: "ui_confirm", channel: "ui", gain: 0.45 },
  ui_error: { id: "ui_error", channel: "ui", gain: 0.5 },
  gacha_tick: { id: "gacha_tick", channel: "sfx", gain: 0.4 },
  gacha_reveal_common: { id: "gacha_reveal_common", channel: "sfx", gain: 0.55 },
  gacha_reveal_rare: { id: "gacha_reveal_rare", channel: "sfx", gain: 0.65 },
  gacha_reveal_s: { id: "gacha_reveal_s", channel: "sfx", gain: 0.8 },
  battle_hit: { id: "battle_hit", channel: "sfx", gain: 0.3 },
  capture_throw: { id: "capture_throw", channel: "sfx", gain: 0.45 },
  capture_shake: { id: "capture_shake", channel: "sfx", gain: 0.35 },
  capture_success: { id: "capture_success", channel: "sfx", gain: 0.6 },
  capture_fail: { id: "capture_fail", channel: "sfx", gain: 0.5 },
  quest_claim: { id: "quest_claim", channel: "sfx", gain: 0.55 },
  gold_gain: { id: "gold_gain", channel: "sfx", gain: 0.45 },
};

export const AUDIO_FILE_BASE = "/assets/audio";

export function gachaRevealSoundForRarity(rarity: Rarity): SoundId {
  if (rarity === "S") return "gacha_reveal_s";
  if (rarity === "A" || rarity === "B") return "gacha_reveal_rare";
  return "gacha_reveal_common";
}
