"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { SPIRIT_CATALOG } from "@/lib/player/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import {
  buildEmptyRoster,
  fetchPlayerSnapshot,
  persistPlaceSpiritFirstFree,
  persistPlaceSpiritOnSlot,
  persistRemoveSpiritFromWheel,
  persistRosterSwap,
  type PlayerSnapshot,
} from "@/lib/player/roster-service";

type PlayerContextValue = {
  ready: boolean;
  supabaseEnabled: boolean;
  user: User | null;
  profile: PlayerSnapshot["profile"] | null;
  currencies: PlayerSnapshot["currencies"] | null;
  roster: SpiritSlot[];
  unlockedHubIds: SpiritId[];
  spiritCount: number;
  welcomePullsRemaining: number;
  gachaPityStandard: number;
  hasSpirits: boolean;
  refresh: () => Promise<void>;
  swapRosterSlots: (fromIndex: number, toIndex: number) => Promise<void>;
  placeSpiritOnSlot: (hubId: SpiritId, slotIndex: number) => Promise<void>;
  placeSpiritFirstFree: (hubId: SpiritId) => Promise<boolean>;
  removeSpiritFromWheel: (hubId: SpiritId) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseEnabled());
  const [user, setUser] = useState<User | null>(null);
  const [snapshot, setSnapshot] = useState<PlayerSnapshot | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseEnabled()) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    setUser(nextUser);

    if (!nextUser) {
      setSnapshot(null);
      setReady(true);
      return;
    }

    const next = await fetchPlayerSnapshot(supabase);
    setSnapshot(next);
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

    return {
      ready,
      supabaseEnabled: supabaseOn,
      user,
      profile: snapshot?.profile ?? null,
      currencies: snapshot?.currencies ?? null,
      roster: mockRoster ? INITIAL_ROSTER : (snapshot?.roster ?? buildEmptyRoster()),
      unlockedHubIds: mockRoster
        ? (["bram", "nyx", "luma", "kiro"] as SpiritId[])
        : (snapshot?.unlockedHubIds ?? []),
      spiritCount: snapshot?.spiritCount ?? (mockRoster ? 4 : 0),
      welcomePullsRemaining: snapshot?.profile?.welcome_pulls_remaining ?? 0,
      gachaPityStandard: snapshot?.profile?.gacha_pity_standard ?? 0,
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
