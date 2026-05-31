"use client";

import type { CSSProperties } from "react";
import { MAX_FIELD, type Combatant, type PendingRecruit, type WheelRotation, isFieldWheelIndex } from "@phantoria/game-core";
import { CombatSpirit } from "@/components/run/combat-spirit";
import { hpTone } from "@/components/hub/roster";
import { CORE_HUE } from "./wheel-map";
import { RunRelicsTray } from "@/components/run/run-relics-tray";

type BattleWheelProps = {
  slots: (Combatant | null)[];
  currentId?: string | null;
  canRotate?: boolean;
  onRotate?: (direction: WheelRotation) => void;
  /** Mode placement après capture */
  placementMode?: boolean;
  pendingRecruit?: PendingRecruit | null;
  onPickSlot?: (wheelIndex: number) => void;
  relicIds?: readonly string[];
};

function hpPct(c: Combatant) {
  return c.maxHp > 0 ? Math.round((c.hp / c.maxHp) * 100) : 0;
}

export function BattleWheel({
  slots,
  currentId,
  canRotate = true,
  onRotate,
  placementMode = false,
  pendingRecruit = null,
  onPickSlot,
  relicIds = [],
}: BattleWheelProps) {
  const onField = slots.filter((s) => s?.active && !s.ko).length;
  const filled = slots.filter(Boolean).length;
  const pendingHue = pendingRecruit ? (CORE_HUE[pendingRecruit.templateKey] ?? "#6366f1") : "#6366f1";

  return (
    <aside className={`bwheel ${placementMode ? "bwheel--placement" : ""}`} aria-label="Roue d'esprits">
      <header className="bwheel__head">
        <span className="bwheel__title">Roue</span>
        <span className="bwheel__meta">
          {placementMode
            ? "Choisis un slot"
            : `${onField}/${MAX_FIELD} terrain · ${filled}/6`}
        </span>
      </header>

      {placementMode && pendingRecruit ? (
        <div className="bwheel__pending">
          <div className="bwheel__pending-bubble" style={{ background: `color-mix(in srgb, ${pendingHue} 75%, #000 25%)` }}>
            <CombatSpirit
              templateKey={pendingRecruit.templateKey}
              name={pendingRecruit.name}
              className="bwheel__pending-sprite"
            />
          </div>
          <p className="bwheel__pending-name">{pendingRecruit.name}</p>
          <p className="bwheel__pending-hint">Clique un slot — remplace l&apos;esprit sur place si occupé</p>
        </div>
      ) : null}

      <div className="bwheel__arena">
        <div className="bwheel__field-arc" aria-hidden title="Zone terrain (haut)" />
        <div className="bwheel__ring" aria-hidden />

        {slots.map((c, i) => {
          const empty = !c;
          const hue = c ? (CORE_HUE[c.templateKey] ?? "#64748b") : "#475569";
          const acting = c?.instanceId === currentId;
          const isTerrainSlot = isFieldWheelIndex(i);

          const SlotTag = placementMode ? "button" : "div";
          const slotProps = placementMode
            ? {
                type: "button" as const,
                onClick: () => onPickSlot?.(i),
                "aria-label": empty
                  ? `Placer ${pendingRecruit?.name ?? "recrue"} sur slot libre ${i + 1}`
                  : `Remplacer ${c!.name} par ${pendingRecruit?.name ?? "recrue"}`,
              }
            : {};

          return (
            <SlotTag
              key={empty ? `empty-${i}` : c.instanceId}
              className={`bwheel__slot ${empty ? "bwheel__slot--empty" : ""} ${isTerrainSlot ? "bwheel__slot--zone" : ""} ${c?.active ? "bwheel__slot--field" : ""} ${c?.ko ? "bwheel__slot--ko" : ""} ${acting ? "bwheel__slot--act" : ""} ${placementMode ? "bwheel__slot--pick" : ""}`}
              style={{ "--i": i, "--hue": hue } as CSSProperties}
              {...slotProps}
            >
              <span className="bwheel__bubble">
                {empty ? (
                  <span className="bwheel__hole" aria-hidden />
                ) : (
                  <CombatSpirit
                    templateKey={c.templateKey}
                    name={c.name}
                    className="bwheel__portrait"
                  />
                )}
              </span>
              {!empty && c ? (
                <>
                  <span className="bwheel__name">{c.name}</span>
                  <div
                    className={`bwheel__hp bwheel__hp--${hpTone(hpPct(c))}`}
                    role="progressbar"
                    aria-valuenow={hpPct(c)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${hpPct(c)}%` }} />
                  </div>
                  {c.active ? <span className="bwheel__tag">T</span> : null}
                </>
              ) : (
                <span className="bwheel__empty-lbl">{placementMode ? "Libre +" : "Libre"}</span>
              )}
            </SlotTag>
          );
        })}
      </div>

      <div className="bwheel__controls">
        <button
          type="button"
          className="bwheel__spin"
          disabled={!canRotate || !onRotate}
          onClick={() => onRotate?.("ccw")}
          aria-label="Tourner la roue à gauche"
        >
          ↺
        </button>
        <span className="bwheel__spin-hint">Arc vert = terrain (haut)</span>
        <button
          type="button"
          className="bwheel__spin"
          disabled={!canRotate || !onRotate}
          onClick={() => onRotate?.("cw")}
          aria-label="Tourner la roue à droite"
        >
          ↻
        </button>
      </div>

      <RunRelicsTray relicIds={relicIds} variant="sidebar" />
    </aside>
  );
}
