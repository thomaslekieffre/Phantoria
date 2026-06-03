import type { Combatant } from "@phantoria/game-core";
import { hubIdForTemplateKey } from "@/components/run/wheel-map";
import type { SpiritId } from "@/components/hub/roster";
import type { OwnedSpiritStats } from "@/lib/player/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import type { StoryAllySetup } from "@/lib/story/story-roster";

const LOCAL_SPIRITS_KEY = "phantoria_spirits_local";

export function loadLocalSpiritStats(): Partial<Record<SpiritId, OwnedSpiritStats>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_SPIRITS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<SpiritId, OwnedSpiritStats>>;
  } catch {
    return {};
  }
}

export function saveLocalSpiritStats(stats: Partial<Record<SpiritId, OwnedSpiritStats>>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_SPIRITS_KEY, JSON.stringify(stats));
}

function combatantToStats(c: Combatant, fullHeal = false): OwnedSpiritStats {
  const hpPct = fullHeal
    ? 100
    : c.maxHp > 0
      ? Math.max(1, Math.round((c.hp / c.maxHp) * 100))
      : 100;
  return { level: c.level, xp: c.xp, hpPct };
}

function hubIdFromCombatant(c: Combatant): SpiritId | null {
  const hub = hubIdForTemplateKey(c.templateKey);
  return hub ?? null;
}

function buildUpdatesFromBattle(
  allies: Combatant[],
  storyAllies: StoryAllySetup[] | undefined,
  fullHeal: boolean,
): Partial<Record<SpiritId, OwnedSpiritStats>> {
  const updates: Partial<Record<SpiritId, OwnedSpiritStats>> = {};

  if (storyAllies?.length) {
    for (const setup of storyAllies) {
      const combat = allies.find((c) => c.side === "ally" && c.wheelIndex === setup.wheelIndex);
      updates[setup.hubId] = {
        level: combat?.level ?? setup.level,
        xp: combat?.xp ?? setup.xp,
        hpPct: fullHeal ? 100 : combat ? combatantToStats(combat, false).hpPct : 1,
      };
    }
    return updates;
  }

  for (const c of allies) {
    const hubId = hubIdFromCombatant(c);
    if (!hubId) continue;
    updates[hubId] = combatantToStats(c, fullHeal);
  }

  return updates;
}

/** Persiste niveau / XP / PV histoire après combat (DB ou localStorage). */
export async function persistStorySpiritStats(
  allies: Combatant[],
  options?: { fullHeal?: boolean; storyAllies?: StoryAllySetup[] },
): Promise<void> {
  const updates = buildUpdatesFromBattle(allies, options?.storyAllies, options?.fullHeal ?? false);

  if (Object.keys(updates).length === 0) return;

  if (!isSupabaseEnabled()) {
    const merged = { ...loadLocalSpiritStats(), ...updates };
    saveLocalSpiritStats(merged);
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const merged = { ...loadLocalSpiritStats(), ...updates };
    saveLocalSpiritStats(merged);
    return;
  }

  const payload = (Object.entries(updates) as [SpiritId, OwnedSpiritStats][]).map(
    ([hubId, stats]) => ({
      hub_id: hubId,
      level: stats.level,
      xp: stats.xp,
      hp_pct: stats.hpPct,
    }),
  );

  const { error } = await supabase.rpc("persist_story_spirit_stats", {
    p_updates: payload,
  });
  if (error) throw new Error(error.message);
}
