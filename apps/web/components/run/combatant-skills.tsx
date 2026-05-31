"use client";

import { describeSkill, getPassive, xpToNextLevel, type Combatant } from "@phantoria/game-core";

type CombatantSkillsProps = {
  c: Combatant;
  title?: string;
};

export function CombatantSkills({ c, title = "Compétences" }: CombatantSkillsProps) {
  const passive = getPassive(c.templateKey, c.tribe);

  return (
    <div className="cskills">
      {passive ? (
        <section className="cskills__block">
          <h4 className="cskills__label">Passif</h4>
          <p className="cskills__passive-name">{passive.name}</p>
          <p className="cskills__passive-desc">{passive.description}</p>
        </section>
      ) : null}

      <section className="cskills__block">
        <h4 className="cskills__label">{title}</h4>
        <ul className="cskills__list">
          <li>
            <span className="cskills__skill-name">{c.skills.basic.name}</span>
            <span className="cskills__skill-meta">Attaque · {describeSkill(c.skills.basic)}</span>
          </li>
          <li>
            <span className="cskills__skill-name">{c.skills.special1.name}</span>
            <span className="cskills__skill-meta">Amultime 1 · {describeSkill(c.skills.special1)}</span>
          </li>
          <li>
            <span className="cskills__skill-name">{c.skills.special2.name}</span>
            <span className="cskills__skill-meta">Amultime 2 · {describeSkill(c.skills.special2)}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export function CombatantXpBar({ c }: { c: Combatant }) {
  const need = xpToNextLevel(c.level, c.rarity);
  const pct = need > 0 ? Math.min(100, Math.round((c.xp / need) * 100)) : 100;

  return (
    <div className="cskills__xp">
      <span className="cskills__xp-label">
        Niv. {c.level}
        {need > 0 ? ` · ${c.xp}/${need} XP` : " · max"}
      </span>
      {need > 0 ? (
        <div className="cskills__xp-bar" role="progressbar" aria-valuenow={c.xp} aria-valuemin={0} aria-valuemax={need}>
          <span style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
