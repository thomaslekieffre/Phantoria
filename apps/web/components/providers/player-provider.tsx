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
import { INITIAL_ROSTER, isSpiritId, type SpiritId, type SpiritSlot } from "@/components/hub/roster";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { buildEmptyRoster, fetchPlayerSnapshot, persistRosterField, type PlayerSnapshot } from "@/lib/player/roster-service";

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
  hasSpirits: boolean;
  refresh: () => Promise<void>;
  toggleField: (hubId: SpiritId) => Promise<void>;
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

  const toggleField = useCallback(
    async (hubId: SpiritId) => {
      if (!isSupabaseEnabled() || !user) {
        setSnapshot((prev) => {
          const roster = prev?.roster ?? INITIAL_ROSTER;
          const slot = roster.find((s) => s.id === hubId);
          if (!slot || slot.empty) return prev;

          const fieldCount = roster.filter((s) => s.onField).length;
          const nextOnField = !slot.onField;
          if (nextOnField && fieldCount >= 3) return prev;

          const nextRoster = roster.map((s) =>
            s.id === hubId ? { ...s, onField: nextOnField } : s,
          );
          return prev ? { ...prev, roster: nextRoster } : prev;
        });
        return;
      }

      const supabase = createClient();
      const slot = snapshot?.roster.find((s) => s.id === hubId);
      if (!slot || slot.empty) return;

      const ok = await persistRosterField(supabase, hubId, !slot.onField);
      if (ok) await refresh();
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
      hasSpirits: mockRoster ? true : (snapshot?.spiritCount ?? 0) > 0,
      refresh,
      toggleField,
      signOut,
    };
  }, [ready, user, snapshot, refresh, toggleField, signOut]);

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
