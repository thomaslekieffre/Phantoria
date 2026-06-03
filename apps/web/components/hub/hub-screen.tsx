"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";
import { HubPanel } from "./hub-panel";
import { HubBenchPicker } from "./hub-bench-picker";
import { isSpiritId, rosterIndexForHubId, type SpiritId, type SpiritSlot } from "./roster";
import { SceneBackdrop } from "./scene-backdrop";
import { SpiritWheel } from "./spirit-wheel";
import { SPIRIT_CATALOG } from "@/lib/player/types";
import "./hub.css";

export function HubScreen() {
  const {
    roster,
    profile,
    unlockedHubIds,
    swapRosterSlots,
    placeSpiritOnSlot,
    removeSpiritFromWheel,
    hasSpirits,
    spiritCount,
    runsCompleted,
    hubEvent,
  } = usePlayer();

  const [selectedId, setSelectedId] = useState<SpiritSlot["id"] | null>(null);
  const [pickSlotIndex, setPickSlotIndex] = useState<number | null>(null);

  const selected = useMemo(
    () => roster.find((s) => s.id === selectedId && !s.empty) ?? null,
    [roster, selectedId],
  );

  const selectedSlotIndex = useMemo(() => {
    if (!selected || !isSpiritId(selected.id)) return null;
    const idx = rosterIndexForHubId(roster, selected.id);
    return idx >= 0 ? idx : null;
  }, [roster, selected]);

  const displayName = profile?.display_name ?? "Tomy";
  const displayLevel = profile?.level ?? 1;

  const onWheelIds = useMemo(() => {
    const ids = new Set<SpiritId>();
    for (const s of roster) {
      if (!s.empty && isSpiritId(s.id)) ids.add(s.id);
    }
    return ids;
  }, [roster]);

  const benchSpirits = useMemo(
    () => unlockedHubIds.filter((id) => !onWheelIds.has(id)).map((id) => SPIRIT_CATALOG[id]),
    [unlockedHubIds, onWheelIds],
  );

  const wheelFull = roster.every((s) => !s.empty);
  const targetEmptySlotIndex = useMemo(() => {
    if (pickSlotIndex != null && roster[pickSlotIndex]?.empty) return pickSlotIndex;
    return roster.findIndex((s) => s.empty);
  }, [pickSlotIndex, roster]);

  function handleSlotClick(index: number) {
    const slot = roster[index];
    if (!slot) return;

    if (pickSlotIndex === null) {
      if (!slot.empty) setSelectedId(slot.id);
      else setSelectedId(null);
      setPickSlotIndex(index);
      return;
    }

    if (pickSlotIndex === index) {
      setPickSlotIndex(null);
      return;
    }

    void swapRosterSlots(pickSlotIndex, index);
    setPickSlotIndex(null);
    if (!slot.empty) setSelectedId(slot.id);
  }

  async function handleRemoveFromWheel() {
    if (!selected || !isSpiritId(selected.id)) return;
    const ok = await removeSpiritFromWheel(selected.id);
    if (ok) {
      setSelectedId(null);
      setPickSlotIndex(null);
    }
  }

  function handlePlaceBenchSpirit(hubId: SpiritId) {
    const slotIndex =
      pickSlotIndex != null && roster[pickSlotIndex]?.empty
        ? pickSlotIndex
        : roster.findIndex((s) => s.empty);
    if (slotIndex < 0) return;
    void placeSpiritOnSlot(hubId, slotIndex).then(() => {
      setSelectedId(hubId);
      setPickSlotIndex(slotIndex);
    });
  }

  return (
    <GameShell active="camp">
      <div className="hub">
        <SceneBackdrop />
        <div className="hub__center">
          <p className="hub__line">
            <span className="hub__crumb" aria-hidden>
              ‹
            </span>{" "}
            Sanctuaire · <strong>{displayName}</strong> · histoire niv. {displayLevel}
          </p>
          <SpiritWheel
            roster={roster}
            selectedId={selectedId}
            pickSlotIndex={pickSlotIndex}
            onSlotClick={handleSlotClick}
          />
          {!hasSpirits ? (
            <Link href="/gacha" className="hub__gacha-cta">
              Invoquer tes premiers esprits
            </Link>
          ) : null}
        </div>
        <HubPanel
          selected={selected}
          selectedSlotIndex={selectedSlotIndex}
          onRemoveFromWheel={selected ? () => void handleRemoveFromWheel() : undefined}
          onClearSelection={() => {
            setSelectedId(null);
            setPickSlotIndex(null);
          }}
          hasSpirits={hasSpirits}
          spiritCount={spiritCount}
          runsCompleted={runsCompleted}
          hubEvent={hubEvent}
          benchPicker={
            hasSpirits ? (
              <HubBenchPicker
                spirits={benchSpirits}
                targetSlotIndex={targetEmptySlotIndex >= 0 ? targetEmptySlotIndex : null}
                wheelFull={wheelFull}
                onPlace={handlePlaceBenchSpirit}
              />
            ) : null
          }
        />
      </div>
    </GameShell>
  );
}

/** Alias historique */
export const CampScreen = HubScreen;
