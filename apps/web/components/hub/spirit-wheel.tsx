"use client";

import type { CSSProperties } from "react";
import { hpTone, isSpiritId, MAX_FIELD, type SpiritSlot } from "./roster";
import { SpiritPortrait } from "./spirit-portrait";

type SpiritWheelProps = {
  roster: SpiritSlot[];
  selectedId: SpiritSlot["id"] | null;
  onSelect: (id: SpiritSlot["id"]) => void;
};

export function SpiritWheel({ roster, selectedId, onSelect }: SpiritWheelProps) {
  const onField = roster.filter((s) => s.onField).length;
  const filled = roster.filter((s) => !s.empty).length;

  return (
    <section className="wheel" aria-label="Roue d'esprits">
      <header className="wheel__head">
        <div>
          <h2 className="wheel__title">Roue d&apos;esprits</h2>
          <p className="wheel__hint">
            Clique un esprit pour voir sa fiche · max {MAX_FIELD} sur le terrain
          </p>
        </div>
        <div
          className="wheel__counter"
          title="Combattants actifs en combat (3 max)"
        >
          <span className="wheel__counter-num">{onField}</span>
          <span className="wheel__counter-lbl">/ {MAX_FIELD} terrain</span>
        </div>
      </header>

      <div className="wheel__arena">
        <div className="wheel__ring" aria-hidden />
        <div className="wheel__ring-glow" aria-hidden />
        {roster.map((slot, i) => {
          const selected = selectedId === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              className={`wheel__slot ${slot.onField ? "wheel__slot--field" : ""} ${slot.empty ? "wheel__slot--empty" : ""} ${selected ? "wheel__slot--selected" : ""}`}
              style={{ "--i": i, "--hue": slot.hue } as CSSProperties}
              disabled={slot.empty}
              onClick={() => !slot.empty && onSelect(slot.id)}
              aria-pressed={selected}
              title={
                slot.empty
                  ? "Emplacement libre — capture ou gacha"
                  : `${slot.name} · ${slot.tribe} · ${slot.hp}% PV`
              }
            >
              <span className="wheel__bubble">
                {slot.empty ? (
                  <span className="wheel__hole" aria-hidden />
                ) : isSpiritId(slot.id) ? (
                  <SpiritPortrait id={slot.id} className="wheel__portrait" />
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
              {slot.onField ? <span className="wheel__tag">Terrain</span> : null}
            </button>
          );
        })}
        <div className="wheel__core">
          <span className="wheel__core-val">{filled}/6</span>
          <span className="wheel__core-lbl">dans la roue</span>
        </div>
      </div>
    </section>
  );
}
