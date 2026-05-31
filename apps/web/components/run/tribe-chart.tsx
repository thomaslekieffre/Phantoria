"use client";

import {
  TRIBES,
  TRIBE_INFO,
  getTypeMultiplier,
  formatMatchupMultiplier,
  type Tribe,
} from "@phantoria/game-core";

type TribeChartProps = {
  focusDefender?: Tribe | null;
  onClose?: () => void;
};

function cellTone(mult: number): string {
  if (mult >= 2) return "tribe-chart__cell--strong";
  if (mult <= 0) return "tribe-chart__cell--immune";
  if (mult <= 0.5) return "tribe-chart__cell--weak";
  return "tribe-chart__cell--neutral";
}

export function TribeChart({ focusDefender, onClose }: TribeChartProps) {
  return (
    <div className="tribe-chart" role="region" aria-label="Table des tribus">
      <div className="tribe-chart__head">
        <div>
          <p className="tribe-chart__kicker">Esprits</p>
          <h3 className="tribe-chart__title">Table des tribus</h3>
          <p className="tribe-chart__legend">
            Ligne = attaque · Colonne = défense · <strong>×2</strong> super efficace · <strong>×½</strong> faible · <strong>×0</strong> immunité
          </p>
        </div>
        {onClose ? (
          <button type="button" className="tribe-chart__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        ) : null}
      </div>

      {focusDefender ? (
        <p className="tribe-chart__focus">
          Colonne surlignée : {TRIBE_INFO[focusDefender].emoji} {TRIBE_INFO[focusDefender].label}
        </p>
      ) : null}

      <div className="tribe-chart__scroll">
        <table className="tribe-chart__table">
          <thead>
            <tr>
              <th scope="col" className="tribe-chart__corner">
                ↓ attaque / défense →
              </th>
              {TRIBES.map((def) => (
                <th
                  key={def}
                  scope="col"
                  className={`tribe-chart__col-head ${focusDefender === def ? "tribe-chart__col-head--focus" : ""}`}
                  title={TRIBE_INFO[def].label}
                >
                  <span aria-hidden>{TRIBE_INFO[def].emoji}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRIBES.map((atk) => (
              <tr key={atk}>
                <th scope="row" className="tribe-chart__row-head" title={TRIBE_INFO[atk].label}>
                  <span aria-hidden>{TRIBE_INFO[atk].emoji}</span>
                  <span className="tribe-chart__row-label">{TRIBE_INFO[atk].label}</span>
                </th>
                {TRIBES.map((def) => {
                  const mult = getTypeMultiplier(atk, def);
                  const focused = focusDefender === def;
                  return (
                    <td
                      key={def}
                      className={`tribe-chart__cell ${cellTone(mult)} ${focused ? "tribe-chart__cell--focus-col" : ""}`}
                      title={`${TRIBE_INFO[atk].label} → ${TRIBE_INFO[def].label} : ${formatMatchupMultiplier(mult)}`}
                    >
                      {atk === def ? "—" : formatMatchupMultiplier(mult)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
