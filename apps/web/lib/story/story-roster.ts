import type { SpiritId } from "@/components/hub/roster";
import { isSpiritId, type SpiritSlot } from "@/components/hub/roster";
import { HUB_TO_CORE } from "@phantoria/game-core";
import type { OwnedSpiritStats } from "@/lib/player/types";

export type StoryAllySetup = {
  key: string;
  wheelIndex: number;
  level: number;
  xp: number;
  hpPct: number;
  hubId: SpiritId;
};

/** Esprits sur la roue sanctuaire → setup combat histoire (niveaux / PV collection). */
export function buildStoryAllySetup(
  roster: SpiritSlot[],
  spiritsByHubId: Partial<Record<SpiritId, OwnedSpiritStats>>,
): StoryAllySetup[] {
  const setup: StoryAllySetup[] = [];

  for (let i = 0; i < roster.length; i++) {
    const slot = roster[i];
    if (!slot || slot.empty || !isSpiritId(slot.id)) continue;

    const core = HUB_TO_CORE[slot.id];
    if (!core) continue;

    const stats = spiritsByHubId[slot.id] ?? { level: 1, xp: 0, hpPct: 100 };
    setup.push({
      key: core,
      wheelIndex: i,
      level: stats.level,
      xp: stats.xp,
      hpPct: stats.hpPct,
      hubId: slot.id,
    });
  }

  return setup;
}

export function rosterHasFieldSpirit(roster: SpiritSlot[]): boolean {
  return buildStoryAllySetup(roster, {}).length > 0;
}
