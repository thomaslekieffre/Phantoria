"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  INITIAL_ROSTER,
  isSpiritId,
  placeSpiritOnSlotLocal,
  removeFromRosterLocal,
  rosterIndexForHubId,
  swapRosterSlotsLocal,
  type SpiritId,
  type SpiritSlot,
} from "@/components/hub/roster";
import { getLocalRunsCompleted } from "@/lib/player/run-stats-local";
import type { PlayerInventory } from "@phantoria/game-core";
import { STARTER_INVENTORY } from "@phantoria/game-core";
import { loadLocalInventory } from "@/lib/player/inventory-service";
import { loadLocalGold } from "@/lib/player/local-currencies";
import { loadLocalSpiritStats } from "@/lib/story/story-result-service";
import { loadStorySave } from "@/lib/story/story-progress";
import { loadQuestSave } from "@/lib/quests/quest-progress";
import { syncLocalStoryToRemote } from "@/lib/story/story-progress";
import { SPIRIT_CATALOG, type OwnedSpiritStats } from "@/lib/player/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import type { HubEvent } from "@/lib/hub/hub-events";
import { FALLBACK_HUB_EVENT } from "@/lib/hub/hub-events";
import { fetchActiveHubEvent } from "@/lib/hub/hub-events-service";
import {
  buildEmptyRoster,
  fetchPlayerSnapshot,
  persistPlaceSpiritFirstFree,
  persistPlaceSpiritOnSlot,
  persistRemoveSpiritFromWheel,
  persistRosterSwap,
  type PlayerSnapshot,
} from "@/lib/player/roster-service";
import type { QuestProgressSnapshot } from "@/lib/player/quest-service";
import type { StorySave } from "@/lib/story/story-progress";

type PlayerContextValue = {
  ready: boolean;
  supabaseEnabled: boolean;
  user: User | null;
  profile: PlayerSnapshot["profile"] | null;
  currencies: PlayerSnapshot["currencies"] | null;
  roster: SpiritSlot[];
  unlockedHubIds: SpiritId[];
  spiritsByHubId: Partial<Record<SpiritId, OwnedSpiritStats>>;
  inventory: PlayerInventory;
  spiritCount: number;
  runsCompleted: number;
  storySave: StorySave;
  questProgress: QuestProgressSnapshot;
  welcomePullsRemaining: number;
  gachaPityStandard: number;
  hubEvent: HubEvent | null;
  hasSpirits: boolean;
  refresh: () => Promise<void>;
  swapRosterSlots: (fromIndex: number, toIndex: number) => Promise<void>;
  placeSpiritOnSlot: (hubId: SpiritId, slotIndex: number) => Promise<void>;
  placeSpiritFirstFree: (hubId: SpiritId) => Promise<boolean>;
  removeSpiritFromWheel: (hubId: SpiritId) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

const MOCK_SPIRITS_BY_HUB: Partial<Record<SpiritId, OwnedSpiritStats>> = {
  bram: { level: 1, xp: 0, hpPct: 100 },
  nyx: { level: 1, xp: 0, hpPct: 72 },
  luma: { level: 1, xp: 0, hpPct: 100 },
  kiro: { level: 1, xp: 0, hpPct: 88 },
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseEnabled());
  const [user, setUser] = useState<User | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);
  const [hubEvent, setHubEvent] = useState<HubEvent | null>(FALLBACK_HUB_EVENT);
  const [statsTick, setStatsTick] = useState(0);
  const [clientMounted, setClientMounted] = useState(false);
  const storySyncedRef = useRef(false);

  useEffect(() => {
    setClientMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseEnabled()) {
      setHubEvent(FALLBACK_HUB_EVENT);
      setStatsTick((n) => n + 1);
      setReady(true);
      return;
    }

    const supabase = createClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    setUser(nextUser);

    const eventPromise = fetchActiveHubEvent(supabase);

    if (!nextUser) {
      setSnapshot(null);
      setHubEvent(await eventPromise);
      setStatsTick((n) => n + 1);
      setReady(true);
      return;
    }

    const [next, event] = await Promise.all([fetchPlayerSnapshot(supabase), eventPromise]);
    setSnapshot(next);
    setHubEvent(event);
    if (nextUser && !storySyncedRef.current) {
      storySyncedRef.current = true;
      void syncLocalStoryToRemote().then(async () => {
        const merged = await fetchPlayerSnapshot(supabase);
        setSnapshot(merged);
        setStatsTick((n) => n + 1);
      });
    }
    setStatsTick((n) => n + 1);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;

    const supabase = createClient();
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const swapRosterSlots = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!isSupabaseEnabled() || !user) {
        setSnapshot((prev) => {
          const roster = prev?.roster ?? INITIAL_ROSTER;
          return prev ? { ...prev, roster: swapRosterSlotsLocal(roster, fromIndex, toIndex) } : prev;
        });
        return;
      }

      const supabase = createClient();
      const ok = await persistRosterSwap(supabase, fromIndex, toIndex);
      if (ok) await refresh();
    },
    [refresh, user],
  );

  const placeSpiritOnSlot = useCallback(
    async (hubId: SpiritId, slotIndex: number) => {
      if (!isSupabaseEnabled() || !user) {
        const meta = SPIRIT_CATALOG[hubId];
        if (!meta) return;
        setSnapshot((prev) => {
          const roster = prev?.roster ?? INITIAL_ROSTER;
          const nextRoster = placeSpiritOnSlotLocal(roster, slotIndex, {
            id: hubId,
            name: meta.name,
            tribe: meta.tribe,
            hp: 100,
            hue: meta.hue,
            rarity: meta.rarity,
          });
          return prev ? { ...prev, roster: nextRoster } : prev;
        });
        return;
      }

      const supabase = createClient();
      const ok = await persistPlaceSpiritOnSlot(supabase, hubId, slotIndex);
      if (ok) await refresh();
    },
    [refresh, user],
  );

  const placeSpiritFirstFree = useCallback(
    async (hubId: SpiritId) => {
      const roster = snapshot?.roster ?? INITIAL_ROSTER;
      const freeIndex = roster.findIndex((s) => s.empty);
      if (freeIndex < 0) return false;

      const fromIndex = roster.findIndex((s) => s.id === hubId);
      if (fromIndex >= 0) {
        await swapRosterSlots(fromIndex, freeIndex);
        return true;
      }

      if (!isSupabaseEnabled() || !user) return false;

      const supabase = createClient();
      const ok = await persistPlaceSpiritFirstFree(supabase, hubId);
      if (ok) await refresh();
      return ok;
    },
    [refresh, snapshot?.roster, swapRosterSlots, user],
  );

  const removeSpiritFromWheel = useCallback(
    async (hubId: SpiritId) => {
      const roster = snapshot?.roster ?? INITIAL_ROSTER;
      const slotIndex = rosterIndexForHubId(roster, hubId);
      if (slotIndex < 0) return false;

      if (!isSupabaseEnabled() || !user) {
        setSnapshot((prev) => {
          const base = prev?.roster ?? INITIAL_ROSTER;
          return prev ? { ...prev, roster: removeFromRosterLocal(base, slotIndex) } : prev;
        });
        return true;
      }

      const supabase = createClient();
      const ok = await persistRemoveSpiritFromWheel(supabase, hubId);
      if (ok) await refresh();
      return ok;
    },
    [refresh, snapshot?.roster, user],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseEnabled()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    await refresh();
  }, [refresh]);

  const value = useMemo<PlayerContextValue>(() => {
    const supabaseOn = isSupabaseEnabled();
    const loggedIn = Boolean(user);
    const mockRoster = !supabaseOn || !loggedIn;
    void statsTick;

    return {
      ready,
      supabaseEnabled: supabaseOn,
      user,
      profile: snapshot?.profile ?? null,
      currencies: mockRoster
        ? clientMounted
          ? { gold: loadLocalGold(), gems: 35, tickets: 2 }
          : { gold: 1200, gems: 35, tickets: 2 }
        : (snapshot?.currencies ?? null),
      roster: mockRoster ? INITIAL_ROSTER : (snapshot?.roster ?? buildEmptyRoster()),
      unlockedHubIds: mockRoster
        ? (["bram", "nyx", "luma", "kiro"] as SpiritId[])
        : (snapshot?.unlockedHubIds ?? []),
      spiritsByHubId: mockRoster
        ? { ...MOCK_SPIRITS_BY_HUB, ...(clientMounted ? loadLocalSpiritStats() : {}) }
        : (snapshot?.spiritsByHubId ?? {}),
      inventory: mockRoster
        ? clientMounted
          ? loadLocalInventory()
          : { ...STARTER_INVENTORY }
        : (snapshot?.inventory ?? { ...STARTER_INVENTORY }),
      spiritCount: snapshot?.spiritCount ?? (mockRoster ? 4 : 0),
      runsCompleted: mockRoster
        ? clientMounted
          ? getLocalRunsCompleted()
          : 0
        : (snapshot?.profile?.runs_completed ?? 0),
      storySave: mockRoster
        ? clientMounted
          ? loadStorySave()
          : { levels: {} }
        : (snapshot?.storySave ?? { levels: {} }),
      questProgress: mockRoster
        ? clientMounted
          ? {
              claimed: loadQuestSave().claimed,
              daily: {
                login: loadQuestSave().daily.login,
                storyWin: loadQuestSave().daily.storyWin,
                runDone: loadQuestSave().daily.runDone,
              },
            }
          : { claimed: [], daily: { login: false, storyWin: false, runDone: false } }
        : (snapshot?.questProgress ?? {
            claimed: [],
            daily: { login: false, storyWin: false, runDone: false },
          }),
      welcomePullsRemaining: snapshot?.profile?.welcome_pulls_remaining ?? 0,
      gachaPityStandard: snapshot?.profile?.gacha_pity_standard ?? 0,
      hubEvent,
      hasSpirits: mockRoster ? true : (snapshot?.spiritCount ?? 0) > 0,
      refresh,
      swapRosterSlots,
      placeSpiritOnSlot,
      placeSpiritFirstFree,
      removeSpiritFromWheel,
      signOut,
    };
  }, [
    ready,
    user,
    snapshot,
    refresh,
    swapRosterSlots,
    placeSpiritOnSlot,
    placeSpiritFirstFree,
    removeSpiritFromWheel,
    signOut,
    statsTick,
    clientMounted,
    hubEvent,
  ]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer hors PlayerProvider");
  return ctx;
}

export function usePlayerOptional() {
  return useContext(PlayerContext);
}

export function rosterStarters(roster: SpiritSlot[]): (SpiritSlot & { id: SpiritId })[] {
  return roster.filter((s): s is SpiritSlot & { id: SpiritId } => isSpiritId(s.id));
}

/** Starters run : tous les esprits possédés (pas seulement ceux sur la roue). */
export function ownedSpiritStarters(
  unlockedHubIds: SpiritId[],
  spiritsByHubId: Partial<Record<SpiritId, OwnedSpiritStats>>,
): (SpiritSlot & { id: SpiritId })[] {
  return unlockedHubIds.map((id) => {
    const meta = SPIRIT_CATALOG[id];
    const stats = spiritsByHubId[id];
    return {
      id,
      name: meta.name,
      tribe: meta.tribe,
      hp: stats?.hpPct ?? 100,
      onField: false,
      hue: meta.hue,
      rarity: meta.rarity,
    };
  });
}
