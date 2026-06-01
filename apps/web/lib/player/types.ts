import type { SpiritId } from "@/components/hub/roster";

export type SpiritMeta = {
  hubId: SpiritId;
  templateKey: string;
  name: string;
  tribe: string;
  hue: string;
};

export const SPIRIT_CATALOG: Record<SpiritId, SpiritMeta> = {
  bram: { hubId: "bram", templateKey: "bram_vaillant", name: "Bram", tribe: "Vaillants", hue: "#f97316" },
  nyx: { hubId: "nyx", templateKey: "nyx_mysterieux", name: "Nyx", tribe: "Mystérieux", hue: "#a855f7" },
  luma: { hubId: "luma", templateKey: "luma_mignon", name: "Luma", tribe: "Mignons", hue: "#ec4899" },
  kiro: { hubId: "kiro", templateKey: "kiro_perfide", name: "Kiro", tribe: "Malins", hue: "#22d3ee" },
};

export type DbProfile = {
  id: string;
  display_name: string;
  level: number;
  welcome_pulls_remaining: number;
};

export type DbCurrencies = {
  gold: number;
  gems: number;
  tickets: number;
};

export type DbPlayerSpirit = {
  id: string;
  hub_id: string;
  template_key: string;
  level: number;
  xp: number;
  hp_pct: number;
};

export type DbRosterSlot = {
  slot_index: number;
  spirit_id: string | null;
  on_field: boolean;
  spirit?: DbPlayerSpirit | null;
};
