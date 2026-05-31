"use client";

import { getRunRelicDisplay } from "@phantoria/game-core";

type RunRelicsTrayProps = {
  relicIds: readonly string[];
  variant?: "sidebar" | "panel";
};

export function RunRelicsTray({ relicIds, variant = "sidebar" }: RunRelicsTrayProps) {
  const relics = getRunRelicDisplay(relicIds);

  return (
    <div
      className={`run-relics run-relics--${variant} ${relics.length === 0 ? "run-relics--empty" : ""}`}
      aria-label="Reliques du run"
    >
      <span className="run-relics__label">Reliques</span>
      {relics.length === 0 ? (
        <span className="run-relics__empty">Aucune</span>
      ) : (
        <ul className="run-relics__list">
          {relics.map((r) => (
            <li
              key={r.id}
              className="run-relics__chip"
              title={r.description ? `${r.name} — ${r.description}` : r.name}
            >
              <span className="run-relics__emoji" aria-hidden>
                {r.emoji}
              </span>
              <span className="run-relics__name">{r.name}</span>
              {r.count > 1 ? <span className="run-relics__stack">×{r.count}</span> : null}
              {r.description ? (
                <span className="run-relics__tip" role="tooltip">
                  <span className="run-relics__tip-name">{r.name}</span>
                  <span className="run-relics__tip-desc">{r.description}</span>
                  {r.count > 1 ? (
                    <span className="run-relics__tip-stack">Possédée ×{r.count}</span>
                  ) : null}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
