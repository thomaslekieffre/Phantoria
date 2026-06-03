"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { STORY_ZONES, getStoryZone, levelsForZone } from "@phantoria/game-core";
import { useStoryProgress } from "@/lib/story/use-story-progress";
import {
  STORY_MAP_NODE_POSITIONS,
  STORY_MAP_STAGE_HEIGHT,
  buildMapTrailPath,
  isBossLevel,
} from "@/lib/story/story-map-layout";
import { usePlayer } from "@/components/providers/player-provider";
import { rosterHasFieldSpirit } from "@/lib/story/story-roster";
import "./story.css";

function StarRow({ count, size = "sm" }: { count: number; size?: "sm" | "lg" }) {
  return (
    <span
      className={`story-stars ${size === "lg" ? "story-stars--lg" : ""}`}
      aria-label={`${count} étoile${count > 1 ? "s" : ""}`}
    >
      {[1, 2, 3].map((i) => (
        <span key={i} className={`story-stars__one ${i <= count ? "story-stars__one--on" : ""}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function MapNode({
  index,
  zoneId,
  levelTitle,
  playable,
  cleared,
  stars,
  isBoss,
  isCurrent,
  pos,
  nodeRef,
}: {
  index: number;
  zoneId: number;
  levelTitle?: string;
  playable: boolean;
  cleared: boolean;
  stars: number;
  isBoss: boolean;
  isCurrent: boolean;
  pos: { x: number; y: number };
  nodeRef?: Ref<HTMLAnchorElement>;
}) {
  const inner = (
    <>
      {cleared && stars > 0 ? (
        <span className="story-node__stars">
          <StarRow count={stars} />
        </span>
      ) : null}
      {isBoss ? <span className="story-node__boss-tag">BOSS</span> : null}
      <div className={`story-node__core ${playable ? "" : "story-node__core--lock"}`}>
        <span className="story-node__num">{index}</span>
      </div>
      {levelTitle && playable ? <span className="story-node__tip">{levelTitle}</span> : null}
    </>
  );

  const className = [
    "story-node",
    isBoss ? "story-node--boss" : "",
    cleared ? "story-node--cleared" : "",
    isCurrent ? "story-node--current" : "",
    !playable ? "story-node--lock" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style = { left: `${pos.x}%`, top: `${pos.y}%` } as const;

  if (playable) {
    return (
      <Link
        ref={nodeRef}
        href={`/story/${zoneId}/${index}`}
        className={className}
        style={style}
        aria-label={`Niveau ${index}${levelTitle ? ` — ${levelTitle}` : ""}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} style={style} aria-disabled aria-label={`Niveau ${index} verrouillé`}>
      {inner}
    </div>
  );
}

export function StoryMapScreen() {
  const { hasSpirits, roster, profile } = usePlayer();
  const { getProgress, isUnlocked, isZoneUnlocked, starsTotal } = useStoryProgress();
  const [zoneId, setZoneId] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentNodeRef = useRef<HTMLAnchorElement>(null);

  const zone = getStoryZone(zoneId);
  const levels = useMemo(() => levelsForZone(zoneId), [zoneId]);

  const trailPath = useMemo(
    () => buildMapTrailPath(STORY_MAP_NODE_POSITIONS, 400, STORY_MAP_STAGE_HEIGHT),
    [],
  );

  const currentLevelIndex = useMemo(() => {
    for (let i = 1; i <= 15; i++) {
      const level = levels.find((l) => l.index === i);
      const levelId = level?.id ?? `${zoneId}-${i}`;
      if (level && isUnlocked(levelId, zoneId, i) && !getProgress(levelId)?.cleared) {
        return i;
      }
    }
    return 1;
  }, [levels, zoneId, isUnlocked, getProgress]);

  useEffect(() => {
    const el = currentNodeRef.current;
    if (!el || !scrollRef.current) return;
    // Un petit délai pour s'assurer que le rendu est fait
    const t = setTimeout(() => {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [zoneId, currentLevelIndex]);

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
  const prevZone = STORY_ZONES.find((z) => z.id === zoneId - 1);
  const nextZone = STORY_ZONES.find((z) => z.id === zoneId + 1);

  return (
    <div className="story-world">
      <header className="story-world__hud">
        <div className="story-world__banner-wrap">
          {prevZone ? (
            <button
              type="button"
              className="story-world__zone-arrow"
              disabled={zoneId <= 1}
              onClick={() => setZoneId((z) => Math.max(1, z - 1))}
              aria-label="Zone précédente"
            >
              ‹
            </button>
          ) : (
            <span className="story-world__zone-arrow story-world__zone-arrow--ghost" />
          )}

          <div className="story-world__banner">
            <span className="story-world__banner-title">
              {zone?.emoji ?? "⚔️"} {zone?.name ?? "Campagne"}
            </span>
            <span className="story-world__banner-meta">
              Niv. {profile?.level ?? 1} · {starsTotal} ★
            </span>
          </div>

          {nextZone ? (
            <button
              type="button"
              className="story-world__zone-arrow"
              disabled={!isZoneUnlocked(nextZone.id)}
              onClick={() => isZoneUnlocked(nextZone.id) && setZoneId(nextZone.id)}
              aria-label="Zone suivante"
            >
              ›
            </button>
          ) : (
            <span className="story-world__zone-arrow story-world__zone-arrow--ghost" />
          )}
        </div>
      </header>

      {!wheelReady ? (
        <div className="story-world__warn">
          Place un esprit sur la roue du <Link href="/">sanctuaire</Link> pour combattre.
        </div>
      ) : null}

      <div className="story-world__scroll" ref={scrollRef}>
        <div
          className={`story-world__stage story-world__stage--zone-${zoneId}`}
          style={{ height: STORY_MAP_STAGE_HEIGHT }}
        >
          <svg
            className="story-world__trail"
            viewBox={`0 0 400 ${STORY_MAP_STAGE_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <path className="story-world__trail-line" d={trailPath} />
            {STORY_MAP_NODE_POSITIONS.map((p, i) => (
              <circle
                key={i}
                className="story-world__trail-dot"
                cx={(p.x / 100) * 400}
                cy={(p.y / 100) * STORY_MAP_STAGE_HEIGHT}
                r={i === 0 || i === STORY_MAP_NODE_POSITIONS.length - 1 ? 5 : 4}
              />
            ))}
          </svg>

          {zone
            ? STORY_MAP_NODE_POSITIONS.map((pos, i) => {
                const index = i + 1;
                const level = levels.find((l) => l.index === index);
                const levelId = level?.id ?? `${zoneId}-${index}`;
                const unlocked = level ? isUnlocked(levelId, zoneId, index) : false;
                const progress = getProgress(levelId);
                const playable = Boolean(level) && unlocked && wheelReady;
                const isCurrent = index === currentLevelIndex;

                return (
                  <MapNode
                    key={levelId}
                    nodeRef={isCurrent && playable ? currentNodeRef : undefined}
                    index={index}
                    zoneId={zoneId}
                    levelTitle={level?.title}
                    playable={playable}
                    cleared={Boolean(progress?.cleared)}
                    stars={progress?.stars ?? 0}
                    isBoss={isBossLevel(index)}
                    isCurrent={isCurrent}
                    pos={pos}
                  />
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}
