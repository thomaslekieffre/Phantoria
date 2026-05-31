"use client";

import { useMemo, useState } from "react";
import { GameShell } from "@/components/layout/game-shell";
import { HubPanel } from "./hub-panel";
import { INITIAL_ROSTER, MAX_FIELD, type SpiritSlot } from "./roster";
import { SceneBackdrop } from "./scene-backdrop";
import { SpiritWheel } from "./spirit-wheel";
import "./hub.css";

export function HubScreen() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [selectedId, setSelectedId] = useState<SpiritSlot["id"] | null>("bram");

  const selected = useMemo(
    () => roster.find((s) => s.id === selectedId && !s.empty) ?? null,
    [roster, selectedId],
  );

  const fieldCount = roster.filter((s) => s.onField).length;

  function toggleField(id: SpiritSlot["id"]) {
    setRoster((prev) => {
      const slot = prev.find((s) => s.id === id);
      if (!slot || slot.empty) return prev;

      if (slot.onField) {
        return prev.map((s) =>
          s.id === id ? { ...s, onField: false } : s,
        );
      }

      if (prev.filter((s) => s.onField).length >= MAX_FIELD) return prev;

      return prev.map((s) =>
        s.id === id ? { ...s, onField: true } : s,
      );
    });
  }

  return (
    <GameShell active="camp">
      <div className="hub">
        <SceneBackdrop />
        <div className="hub__center">
          <p className="hub__line">
            Sanctuaire · <strong>Tomy</strong> · niv. 12
          </p>
          <SpiritWheel
            roster={roster}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <HubPanel
          selected={selected}
          onToggleField={toggleField}
          fieldCount={fieldCount}
        />
      </div>
    </GameShell>
  );
}

/** Alias historique */
export const CampScreen = HubScreen;
