"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STORY_ZONES, getStoryZone, levelsForZone } from "@phantoria/game-core";
import {
  isStoryLevelUnlocked,
  getLevelProgress,
  totalStoryStars,
} from "@/lib/story/story-progress";
import { usePlayer } from "@/components/providers/player-provider";
import { rosterHasFieldSpirit } from "@/lib/story/story-roster";
import "./story.css";

function StarRow({ count }: { count: number }) {
  return (
    <span className="story-stars" aria-label={`${count} étoile${count > 1 ? "s" : ""}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`story-stars__one ${i <= count ? "story-stars__one--on" : ""}`}>
          ★
        </span>
      ))}
    </span>
  );
}

export function StoryMapScreen() {
  const { hasSpirits, roster, profile } = usePlayer();
  const [zoneId, setZoneId] = useState(1);

  const zone = getStoryZone(zoneId);
  const levels = useMemo(() => levelsForZone(zoneId), [zoneId]);
  const starsTotal = useMemo(() => totalStoryStars(), []);

  if (!hasSpirits) {
    return (
      <div className="page-stub">
        <h1>Mode Histoire</h1>
        <p>Tu n&apos;as pas encore d&apos;esprit. Invoque-les au gacha pour commencer la campagne.</p>
        <Link href="/gacha" className="play play--story" style={{ marginTop: "1rem", padding: "0.75rem 1.5rem" }}>
          Aller au gacha
        </Link>
      </div>
    );
  }

  const wheelReady = rosterHasFieldSpirit(roster);

  return (
    <div className="story-map">
      <header className="story-map__head">
        <div>
          <h1>Mode Histoire</h1>
          <p className="story-map__sub">
            Campagne · niv. joueur {profile?.level ?? 1} · {starsTotal} ★ collectées
          </p>
        </div>
        {!wheelReady ? (
          <p className="story-map__warn">Place au moins un esprit sur la roue du sanctuaire avant de combattre.</p>
        ) : null}
      </header>

      <nav className="story-map__zones" aria-label="Zones">
        {STORY_ZONES.map((z) => {
          const playable = z.id === 1;
          return (
            <button
              key={z.id}
              type="button"
              className={`story-map__zone-tab ${zoneId === z.id ? "story-map__zone-tab--on" : ""} ${!playable ? "story-map__zone-tab--lock" : ""}`}
              disabled={!playable}
              onClick={() => playable && setZoneId(z.id)}
            >
              <span className="story-map__zone-emoji">{z.emoji}</span>
              <span className="story-map__zone-name">{z.name}</span>
              {!playable ? <span className="story-map__lock">Bientôt</span> : null}
            </button>
          );
        })}
      </nav>

      {zone ? (
        <section className="story-map__path" aria-label={zone.name}>
          <h2 className="story-map__zone-title">
            {zone.emoji} {zone.name}
          </h2>
          <ol className="story-map__nodes">
            {Array.from({ length: zone.levelCount }, (_, i) => {
              const index = i + 1;
              const level = levels.find((l) => l.index === index);
              const levelId = level?.id ?? `${zoneId}-${index}`;
              const unlocked = level ? isStoryLevelUnlocked(levelId, zoneId, index) : false;
              const progress = getLevelProgress(levelId);
              const playable = Boolean(level) && unlocked && wheelReady;

              return (
                <li key={levelId} className="story-map__node-wrap">
                  {playable ? (
                    <Link
                      href={`/story/${zoneId}/${index}`}
                      className={`story-map__node ${progress?.cleared ? "story-map__node--done" : ""}`}
                    >
                      <span className="story-map__node-num">{index}</span>
                      {level ? <span className="story-map__node-title">{level.title}</span> : null}
                      {progress?.cleared ? <StarRow count={progress.stars} /> : null}
                    </Link>
                  ) : (
                    <div
                      className={`story-map__node story-map__node--lock ${!level ? "story-map__node--future" : ""}`}
                      aria-disabled
                    >
                      <span className="story-map__node-num">{index}</span>
                      {level ? (
                        <>
                          <span className="story-map__node-title">{level.title}</span>
                          {!unlocked ? <span className="story-map__lock">Verrouillé</span> : null}
                        </>
                      ) : (
                        <span className="story-map__lock">—</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <p className="story-map__hint">
        L&apos;équipe = esprits sur la roue du sanctuaire · niveaux et PV = progression histoire (codex).
      </p>
    </div>
  );
}
