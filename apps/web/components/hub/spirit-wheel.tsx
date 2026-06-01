"use client";

import type { CSSProperties } from "react";
import { hpTone, isSpiritId, isFieldSlotIndex, MAX_FIELD, MAX_WHEEL, type SpiritSlot } from "./roster";
import { SpiritPortrait } from "./spirit-portrait";
import { RarityBadge } from "@/components/ui/rarity-badge";

type SpiritWheelProps = {
  roster: SpiritSlot[];
  selectedId: SpiritSlot["id"] | null;
  pickSlotIndex: number | null;
  onSlotClick: (slotIndex: number) => void;
};

export function SpiritWheel({ roster, selectedId, pickSlotIndex, onSlotClick }: SpiritWheelProps) {
  const fieldFilled = roster.filter((s, i) => !s.empty && isFieldSlotIndex(i)).length;
  const filled = roster.filter((s) => !s.empty).length;

  return (
    <section className="wheel" aria-label="Roue d'esprits">
      <header className="wheel__head">
        <div>
          <h2 className="wheel__title">Roue d&apos;esprits</h2>
          <p className="wheel__hint">
            2 clics pour échanger · les {MAX_FIELD} devant (haut) = terrain
          </p>
        </div>
        <div className="wheel__counter" title="Combattants actifs (3 premiers emplacements)">
          <span className="wheel__counter-num">{fieldFilled}</span>
          <span className="wheel__counter-lbl">/ {MAX_FIELD} terrain</span>
        </div>
      </header>

      <div className="wheel__arena">
        <div className="wheel__ring" aria-hidden />
        <div className="wheel__ring-glow" aria-hidden />
        {roster.map((slot, i) => {
          const selected = selectedId === slot.id;
          const isField = !slot.empty && isFieldSlotIndex(i);
          const isPick = pickSlotIndex === i;
          return (
            <button
              key={`${slot.id}-${i}`}
              type="button"
              className={`wheel__slot ${isField ? "wheel__slot--field" : ""} ${slot.empty ? "wheel__slot--empty" : ""} ${selected ? "wheel__slot--selected" : ""} ${isPick ? "wheel__slot--pick" : ""}`}
              style={{ "--i": i, "--hue": slot.hue } as CSSProperties}
              onClick={() => onSlotClick(i)}
              aria-pressed={selected || isPick}
              title={
                slot.empty
                  ? "Emplacement libre — échange ou gacha"
                  : `${slot.name} · ${slot.tribe} · ${slot.hp}% PV${isField ? " · terrain" : ""}`
              }
            >
              <span className="wheel__bubble">
                {slot.empty ? (
                  <span className="wheel__hole" aria-hidden />
                ) : isSpiritId(slot.id) ? (
                  <>
                    {slot.rarity ? (
                      <RarityBadge rarity={slot.rarity} size="xs" className="wheel__rarity" />
                    ) : null}
                    <SpiritPortrait id={slot.id} className="wheel__portrait" />
                  </>
                ) : null}
              </span>
              {!slot.empty ? (
                <>
                  <span className="wheel__name">{slot.name}</span>
                  <span className="wheel__tribe">{slot.tribe}</span>
                  <div
                    className={`wheel__hp wheel__hp--${hpTone(slot.hp)}`}
                    role="progressbar"
                    aria-valuenow={slot.hp}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${slot.hp}%` }} />
                  </div>
                </>
              ) : (
                <span className="wheel__empty-label">Libre</span>
              )}
              {isField ? <span className="wheel__tag">Terrain</span> : null}
            </button>
          );
        })}
        <div className="wheel__core">
          <span className="wheel__core-val">{filled}/{MAX_WHEEL}</span>
          <span className="wheel__core-lbl">dans la roue</span>
        </div>
      </div>
    </section>
  );
}
