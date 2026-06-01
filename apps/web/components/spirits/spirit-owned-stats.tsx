"use client";

import { MAX_LEVEL_BY_RARITY, xpToNextLevel, type Rarity } from "@phantoria/game-core";
import { hpTone } from "@/components/hub/roster";
import type { OwnedSpiritStats } from "@/lib/player/types";

type SpiritOwnedStatsProps = {
  stats: OwnedSpiritStats;
  rarity: Rarity;
};

export function SpiritOwnedStats({ stats, rarity }: SpiritOwnedStatsProps) {
  const cap = MAX_LEVEL_BY_RARITY[rarity];
  const atCap = stats.level >= cap;
  const xpNeed = xpToNextLevel(stats.level, rarity);
  const xpPct = atCap || xpNeed <= 0 ? 100 : Math.min(100, Math.round((stats.xp / xpNeed) * 100));

  return (
    <div className="spirit-owned-stats">
      <p className="spirit-owned-stats__mode">Progression mode Histoire — en run, l&apos;esprit repart à 1.</p>

      <div className="spirit-owned-stats__row">
        <span className="spirit-owned-stats__label">Niveau (histoire)</span>
        <span className="spirit-owned-stats__val">
          {stats.level}
          {atCap ? " (max)" : ` / ${cap}`}
        </span>
      </div>

      {!atCap && xpNeed > 0 ? (
        <div className="spirit-sheet__stat">
          <div className="spirit-sheet__stat-head">
            <span>Expérience</span>
            <span className="spirit-sheet__stat-val">
              {stats.xp} / {xpNeed}
            </span>
          </div>
          <div
            className="spirit-sheet__hp spirit-sheet__hp--ok"
            role="progressbar"
            aria-valuenow={stats.xp}
            aria-valuemin={0}
            aria-valuemax={xpNeed}
          >
            <span style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      ) : null}

      <div className="spirit-sheet__stat">
        <div className="spirit-sheet__stat-head">
          <span>Points de vie</span>
          <span className="spirit-sheet__stat-val">{stats.hpPct}%</span>
        </div>
        <div
          className={`spirit-sheet__hp spirit-sheet__hp--${hpTone(stats.hpPct)}`}
          role="progressbar"
          aria-valuenow={stats.hpPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${stats.hpPct}%` }} />
        </div>
      </div>
    </div>
  );
}
