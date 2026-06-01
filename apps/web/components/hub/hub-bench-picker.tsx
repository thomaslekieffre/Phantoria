"use client";

import type { CSSProperties } from "react";
import { SpiritPortrait } from "./spirit-portrait";
import type { SpiritId } from "./roster";
import { RarityBadge } from "@/components/ui/rarity-badge";
import type { SpiritMeta } from "@/lib/player/types";

type HubBenchPickerProps = {
  spirits: SpiritMeta[];
  targetSlotIndex: number | null;
  wheelFull: boolean;
  onPlace: (hubId: SpiritId) => void;
};

export function HubBenchPicker({
  spirits,
  targetSlotIndex,
  wheelFull,
  onPlace,
}: HubBenchPickerProps) {
  if (spirits.length === 0) return null;

  return (
    <section className="hub-bench" aria-label="Esprits hors roue">
      <header className="hub-bench__head">
        <h3 className="hub-bench__title">Réserve</h3>
        <span className="hub-bench__count">{spirits.length} hors roue</span>
      </header>
      <p className="hub-bench__hint">
        {wheelFull
          ? "Roue pleine — retire un esprit ou échange avant d'en ajouter."
          : targetSlotIndex != null
            ? `Emplacement ${targetSlotIndex + 1} sélectionné — clique un esprit pour le placer.`
            : "Clique un esprit, ou sélectionne d'abord un emplacement libre sur la roue."}
      </p>
      <ul className="hub-bench__list">
        {spirits.map((spirit) => (
          <li key={spirit.hubId}>
            <button
              type="button"
              className="hub-bench__card"
              style={{ "--hue": spirit.hue } as CSSProperties}
              disabled={wheelFull}
              onClick={() => onPlace(spirit.hubId)}
            >
              <SpiritPortrait id={spirit.hubId} className="hub-bench__art" />
              <span className="hub-bench__name">{spirit.name}</span>
              <RarityBadge rarity={spirit.rarity} size="xs" className="hub-bench__rarity" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
