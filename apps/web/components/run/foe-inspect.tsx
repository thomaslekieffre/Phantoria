"use client";

import {
  TRIBE_INFO,
  getMatchupsVs,
  getTypeMultiplier,
  computeCaptureChance,
  type Combatant,
  type Tribe,
} from "@phantoria/game-core";
import { CombatSpirit, combatSpiritHue } from "@/components/run/combat-spirit";

type FoeInspectProps = {
  foe: Combatant;
  fieldAllies: Combatant[];
  onClose: () => void;
  onCapture?: () => void;
  onOpenChart: () => void;
};

function TribeChip({ tribe }: { tribe: Tribe }) {
  const info = TRIBE_INFO[tribe];
  return (
    <span className="foe-inspect__chip">
      {info.emoji} {info.label}
    </span>
  );
}

export function FoeInspect({ foe, fieldAllies, onClose, onCapture, onOpenChart }: FoeInspectProps) {
  const ratio = foe.maxHp > 0 ? foe.hp / foe.maxHp : 0;
  const matchups = getMatchupsVs(foe.tribe);
  const tribeInfo = TRIBE_INFO[foe.tribe];
  const captureChance = Math.round(computeCaptureChance(foe.rarity, ratio, "standard") * 100);
  const canCapture = !foe.ko && ratio <= 0.4;
  const hue = combatSpiritHue(foe.templateKey);

  const allyHints = fieldAllies
    .filter((a) => !a.ko)
    .map((a) => ({
      ally: a,
      mult: getTypeMultiplier(a.tribe, foe.tribe),
    }))
    .sort((a, b) => b.mult - a.mult);

  return (
    <aside className="foe-inspect" role="dialog" aria-label={`Esprit ${foe.name}`}>
      <div className="foe-inspect__head">
        <p className="foe-inspect__kicker">Esprit adverse</p>
        <button type="button" className="foe-inspect__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>

      <div className="foe-inspect__hero">
        <div className="foe-inspect__portrait" style={{ background: `color-mix(in srgb, ${hue} 75%, #000 25%)` }}>
          <CombatSpirit templateKey={foe.templateKey} name={foe.name} className="foe-inspect__sprite" />
        </div>
        <div>
          <h3 className="foe-inspect__name">{foe.name}</h3>
          <p className="foe-inspect__tribe">
            {tribeInfo.emoji} {tribeInfo.label}
          </p>
          <p className="foe-inspect__meta">
            Niv. {foe.level} · {Math.round(ratio * 100)} % PV
          </p>
        </div>
      </div>

      <section className="foe-inspect__block">
        <h4 className="foe-inspect__label">Fort contre lui</h4>
        {matchups.strong.length > 0 ? (
          <div className="foe-inspect__chips">
            {matchups.strong.map((t) => (
              <TribeChip key={t} tribe={t} />
            ))}
          </div>
        ) : (
          <p className="foe-inspect__empty">Aucune tribu ×2 dans le tableau.</p>
        )}
      </section>

      {matchups.weak.length > 0 ? (
        <section className="foe-inspect__block">
          <h4 className="foe-inspect__label">Faible contre lui</h4>
          <div className="foe-inspect__chips foe-inspect__chips--weak">
            {matchups.weak.map((t) => (
              <TribeChip key={t} tribe={t} />
            ))}
          </div>
        </section>
      ) : null}

      {matchups.immune.length > 0 ? (
        <section className="foe-inspect__block">
          <h4 className="foe-inspect__label">Immunité</h4>
          <div className="foe-inspect__chips foe-inspect__chips--immune">
            {matchups.immune.map((t) => (
              <TribeChip key={t} tribe={t} />
            ))}
          </div>
        </section>
      ) : null}

      {allyHints.length > 0 ? (
        <section className="foe-inspect__block">
          <h4 className="foe-inspect__label">Ton terrain</h4>
          <ul className="foe-inspect__allies">
            {allyHints.map(({ ally, mult }) => (
              <li key={ally.instanceId} className={`foe-inspect__ally foe-inspect__ally--${mult >= 2 ? "up" : mult <= 0.5 ? "down" : "mid"}`}>
                <span>{ally.name}</span>
                <span className="foe-inspect__ally-tribe">
                  {TRIBE_INFO[ally.tribe].emoji} {mult >= 2 ? "×2" : mult <= 0 ? "×0" : mult <= 0.5 ? "×½" : "×1"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="foe-inspect__actions">
        <button type="button" className="foe-inspect__btn foe-inspect__btn--chart" onClick={onOpenChart}>
          Table des tribus
        </button>
        {canCapture && onCapture ? (
          <button type="button" className="foe-inspect__btn foe-inspect__btn--capture" onClick={onCapture}>
            Phantoball · {captureChance} %
          </button>
        ) : null}
      </div>
    </aside>
  );
}
