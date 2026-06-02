import type { Combatant } from "@phantoria/game-core";
import { CORE_TO_HUB } from "@/components/run/wheel-map";
import { isSpiritId, type SpiritId } from "@/components/hub/roster";
import type { OwnedSpiritStats } from "@/lib/player/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";

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

function combatantToStats(c: Combatant): OwnedSpiritStats {
  const hpPct = c.maxHp > 0 ? Math.max(1, Math.round((c.hp / c.maxHp) * 100)) : 100;
  return { level: c.level, xp: c.xp, hpPct };
}

function hubIdFromCombatant(c: Combatant): SpiritId | null {
  const hub = CORE_TO_HUB[c.templateKey];
  return hub && isSpiritId(hub) ? hub : null;
}

/** Persiste niveau / XP / PV histoire après combat (DB ou localStorage). */
export async function persistStorySpiritStats(allies: Combatant[]): Promise<void> {
  const updates: Partial<Record<SpiritId, OwnedSpiritStats>> = {};

  for (const c of allies) {
    const hubId = hubIdFromCombatant(c);
    if (!hubId) continue;
    updates[hubId] = combatantToStats(c);
  }

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
