"use client";

import type { RunRewardDef } from "@phantoria/game-core";
import { RunRelicsTray } from "@/components/run/run-relics-tray";

type WaveRewardPickerProps = {
  wave: number;
  choices: RunRewardDef[];
  relicIds: readonly string[];
  onPick: (rewardId: string) => void;
};

export function WaveRewardPicker({ wave, choices, relicIds, onPick }: WaveRewardPickerProps) {
  return (
    <div className="battle__overlay battle__overlay--dim" role="dialog" aria-label="Choix de récompense">
      <div className="wave-reward">
        <p className="wave-reward__kicker">Vague {wave} cleared</p>
        <h2 className="wave-reward__title">Choisis un objet</h2>

        <RunRelicsTray relicIds={relicIds} variant="panel" />

        <div className="wave-reward__grid">
          {choices.map((r) => (
            <button
              key={r.id}
              type="button"
              className="wave-reward__card"
              onClick={() => onPick(r.id)}
            >
              <span className="wave-reward__emoji" aria-hidden>
                {r.emoji}
              </span>
              <span className="wave-reward__name">{r.name}</span>
              <span className="wave-reward__desc">{r.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
