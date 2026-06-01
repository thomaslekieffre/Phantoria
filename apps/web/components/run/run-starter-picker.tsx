"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { HUB_TO_CORE } from "@phantoria/game-core";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { INITIAL_ROSTER, isSpiritId, type SpiritId, type SpiritSlot } from "@/components/hub/roster";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { rarityForHubId } from "@/lib/spirit-rarity";
import "./run.css";

const DEFAULT_STARTERS = INITIAL_ROSTER.filter(
  (s): s is SpiritSlot & { id: SpiritId } => isSpiritId(s.id),
);

type RunStarterPickerProps = {
  onPick: (id: SpiritId) => void;
  onContinue?: () => void;
  savedSummary?: { wave: number; phase: "fighting" | "reward_pick" } | null;
  starters?: (SpiritSlot & { id: SpiritId })[];
};

export function RunStarterPicker({
  onPick,
  onContinue,
  savedSummary,
  starters = DEFAULT_STARTERS,
}: RunStarterPickerProps) {
  const hasStarters = starters.length > 0;

  return (
    <div className="run-pick">
      <div className="run-pick__sky" aria-hidden />
      <div className="run-pick__panel">
        <p className="run-pick__eyebrow">Roguelite</p>

        {!hasStarters ? (
          <>
            <h1 className="run-pick__title">Aucun esprit</h1>
            <p className="run-pick__sub">
              Invoque tes premiers esprits au gacha avant de lancer un run.
            </p>
            <Link href="/gacha" className="run-pick__continue">
              Aller au gacha
            </Link>
          </>
        ) : (
          <>
            <h1 className="run-pick__title">Choisis ton premier esprit</h1>
            <p className="run-pick__sub">Tu partiras seul — les autres rejoindront via capture.</p>

            {savedSummary && onContinue ? (
              <button type="button" className="run-pick__continue" onClick={onContinue}>
                Continuer — vague {savedSummary.wave}
                {savedSummary.phase === "reward_pick" ? " (boutique)" : ""}
              </button>
            ) : null}

            <div className="run-pick__grid">
              {starters.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="run-pick__card"
                  style={{ "--hue": s.hue } as CSSProperties}
                  onClick={() => onPick(s.id)}
                >
                  <RarityBadge
                    rarity={s.rarity ?? rarityForHubId(s.id) ?? "E"}
                    size="sm"
                    className="run-pick__rarity"
                  />
                  <SpiritPortrait id={s.id} className="run-pick__portrait" />
                  <span className="run-pick__name">{s.name}</span>
                  <span className="run-pick__tribe">{s.tribe}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <Link href="/" className="run-pick__back">
          Retour au camp
        </Link>
      </div>
    </div>
  );
}

export function starterCoreKey(id: SpiritId): string {
  return HUB_TO_CORE[id] ?? HUB_TO_CORE.bram;
}
