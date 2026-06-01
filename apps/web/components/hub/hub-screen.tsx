"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";
import { HubPanel } from "./hub-panel";
import { isSpiritId, type SpiritSlot } from "./roster";
import { SceneBackdrop } from "./scene-backdrop";
import { SpiritWheel } from "./spirit-wheel";
import "./hub.css";

export function HubScreen() {
  const { roster, profile, toggleField, hasSpirits, spiritCount } = usePlayer();
  const [selectedId, setSelectedId] = useState<SpiritSlot["id"] | null>(null);

  const selected = useMemo(
    () => roster.find((s) => s.id === selectedId && !s.empty) ?? null,
    [roster, selectedId],
  );

  const fieldCount = roster.filter((s) => s.onField).length;
  const displayName = profile?.display_name ?? "Tomy";
  const displayLevel = profile?.level ?? 1;

  function handleToggleField(id: SpiritSlot["id"]) {
    if (!isSpiritId(id)) return;
    void toggleField(id);
  }

  return (
    <GameShell active="camp">
      <div className="hub">
        <SceneBackdrop />
        <div className="hub__center">
          <p className="hub__line">
            Sanctuaire · <strong>{displayName}</strong> · niv. {displayLevel}
          </p>
          <SpiritWheel
            roster={roster}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {!hasSpirits ? (
            <Link href="/gacha" className="hub__gacha-cta">
              Invoquer tes premiers esprits
            </Link>
          ) : null}
        </div>
        <HubPanel
          selected={selected}
          onToggleField={handleToggleField}
          fieldCount={fieldCount}
          hasSpirits={hasSpirits}
          spiritCount={spiritCount}
        />
      </div>
    </GameShell>
  );
}

/** Alias historique */
export const CampScreen = HubScreen;
