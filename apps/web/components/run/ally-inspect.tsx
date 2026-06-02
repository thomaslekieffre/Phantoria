"use client";

import {
  TRIBE_INFO,
  getMatchupsVs,
  getTypeMultiplier,
  computeCaptureChance,
  formatPassiveLine,
  type Combatant,
  type Tribe,
} from "@phantoria/game-core";
import { CombatSpirit, combatSpiritHue } from "@/components/run/combat-spirit";
import { CombatantSkills, CombatantXpBar } from "@/components/run/combatant-skills";
import { RarityBadge } from "@/components/ui/rarity-badge";

type AllyInspectProps = {
  ally: Combatant;
  onClose: () => void;
  className?: string;
};

export function AllyInspect({ ally, onClose, className }: AllyInspectProps) {
  const ratio = ally.maxHp > 0 ? ally.hp / ally.maxHp : 0;
  const tribeInfo = TRIBE_INFO[ally.tribe];
  const hue = combatSpiritHue(ally.templateKey);
  const passiveLine = formatPassiveLine(ally);

  return (
    <aside
      className={`foe-inspect foe-inspect--ally ${className ?? ""}`.trim()}
      role="dialog"
      aria-label={`Esprit ${ally.name}`}
    >
      <div className="foe-inspect__head">
        <p className="foe-inspect__kicker">Allié · terrain</p>
        <button type="button" className="foe-inspect__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>

      <div className="foe-inspect__hero">
        <div className="foe-inspect__portrait" style={{ background: `color-mix(in srgb, ${hue} 75%, #000 25%)` }}>
          <CombatSpirit templateKey={ally.templateKey} name={ally.name} className="foe-inspect__sprite" />
        </div>
        <div>
          <h3 className="foe-inspect__name">
            {ally.name}
            <RarityBadge rarity={ally.rarity} size="md" />
          </h3>
          <p className="foe-inspect__tribe">
            {tribeInfo.emoji} {tribeInfo.label}
          </p>
          <p className="foe-inspect__meta">
            {ally.hp}/{ally.maxHp} PV · {Math.round(ratio * 100)} %
          </p>
          <CombatantXpBar c={ally} />
          {passiveLine ? <p className="foe-inspect__passive-hint">{passiveLine}</p> : null}
        </div>
      </div>

      <CombatantSkills c={ally} />
    </aside>
  );
}
