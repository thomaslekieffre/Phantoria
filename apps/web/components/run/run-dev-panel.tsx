"use client";

import { devJumpToBoss, type CombatEngine } from "@phantoria/game-core";

type RunDevPanelProps = {
  engine: CombatEngine;
  onAction: () => void;
};

export function RunDevPanel({ engine, onAction }: RunDevPanelProps) {
  const state = engine.getState();
  const phase = state.phase;

  const act = (fn: () => boolean) => {
    if (fn()) onAction();
  };

  return (
    <div className="run-dev" aria-label="Outils développeur">
      <span className="run-dev__label">Dev</span>
      <button
        type="button"
        className="run-dev__btn"
        disabled={phase !== "fighting"}
        onClick={() => act(() => engine.devSkipWave())}
      >
        Skip vague
      </button>
      <button type="button" className="run-dev__btn" onClick={() => act(() => engine.devAddGold(50))}>
        +50 €
      </button>
      <button
        type="button"
        className="run-dev__btn"
        disabled={phase === "lost" || phase === "won"}
        onClick={() => act(() => devJumpToBoss(engine))}
      >
        Boss suiv.
      </button>
    </div>
  );
}
