import type { SpiritId } from "@/components/hub/roster";
import { HUB_TO_CORE } from "@phantoria/game-core";

export const CORE_TO_HUB: Record<string, SpiritId> = Object.fromEntries(
  Object.entries(HUB_TO_CORE).map(([hub, core]) => [core, hub as SpiritId]),
) as Record<string, SpiritId>;

export const CORE_HUE: Record<string, string> = {
  bram_vaillant: "#f97316",
  nyx_mysterieux: "#a855f7",
  luma_mignon: "#ec4899",
  kiro_perfide: "#22d3ee",
  ombre_faible: "#6366f1",
  neant_scout: "#14b8a6",
};
