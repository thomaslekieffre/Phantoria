"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  createStoryBattle,
  computeStoryStars,
  getStoryLevelByCoords,
  getStoryZone,
  TRIBE_INFO,
  getTypeMultiplier,
  describeSkill,
  formatPassiveLine,
  CombatEngine,
  computeCaptureChance,
  inventoryToRunBalls,
  runBallsToInventory,
  healItemsFromInventory,
  hasAnyBall,
  totalTribalBalls,
  tribalBallMatches,
  TRIBAL_BALL_IDS,
  TRIBAL_BALL_INFO,
  INVENTORY_CATALOG,
  MAX_FIELD,
  type CombatEvent,
  type Combatant,
  type InventoryItemId,
  type PhantoballType,
} from "@phantoria/game-core";
import { SpiritWheel } from "@/components/hub/spirit-wheel";
import { isSpiritId, type SpiritId } from "@/components/hub/roster";
import { BattleWheel } from "@/components/run/battle-wheel";
import { usePlayer } from "@/components/providers/player-provider";
import { hubIdForTemplateKey } from "@/components/run/wheel-map";
import { CombatSpirit, combatSpiritHue } from "@/components/run/combat-spirit";
import { FoeInspect } from "@/components/run/foe-inspect";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { TribeChart } from "@/components/run/tribe-chart";
import { BattleSpeedControls, getTickDelayMs, type BattleSpeed } from "@/components/run/battle-speed-controls";
import { AllyInspect } from "@/components/run/ally-inspect";
import { buildStoryAllySetup, rosterHasFieldSpirit } from "@/lib/story/story-roster";
import { recordStoryVictory, loadStorySave } from "@/lib/story/story-progress";
import { useStoryProgress } from "@/lib/story/use-story-progress";
import { trackStoryLevelCompleted, trackStoryLevelStarted } from "@/lib/analytics/events";
import { persistStorySpiritStats } from "@/lib/story/story-result-service";
import {
  mergeStoryInventoryEnd,
  persistPlayerInventory,
} from "@/lib/player/inventory-service";
import "../run/run.css";
import "../hub/hub.css";
import "./story.css";

type HitFlashKind = "hit" | "super" | "ko";
type Floater = { id: number; targetId: string; amount: number };

function hubIdOf(c: Combatant): SpiritId | null {
  const id = hubIdForTemplateKey(c.templateKey);
  return id && isSpiritId(id) ? id : null;
}

function hpTone(ratio: number) {
  if (ratio >= 0.6) return "ok";
  if (ratio >= 0.3) return "warn";
  return "low";
}

function targetingLabel(targeting: Combatant["skills"]["basic"]["targeting"]): string {
  switch (targeting) {
    case "single":
      return "Mono";
    case "aoe":
      return "Zone";
    case "random":
      return "Aléatoire";
  }
}

function EnemyFieldSprite({
  c,
  inspected,
  targetable,
  focused,
  matchupMult,
  onClick,
  onContextMenu,
}: {
  c: Combatant;
  inspected?: boolean;
  targetable?: boolean;
  focused?: boolean;
  matchupMult?: number;
  onClick?: () => void;
  onContextMenu?: () => void;
}) {
  const hue = combatSpiritHue(c.templateKey);
  return (
    <button
      type="button"
      className={`battle-foe ${c.ko ? "battle-foe--ko" : ""} ${inspected ? "battle-foe--inspect" : ""} ${targetable ? "battle-foe--target" : ""} ${focused ? "battle-foe--focus" : ""}`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.();
      }}
      disabled={c.ko || (!onClick && !onContextMenu)}
    >
      <div className="battle-foe__body" style={{ background: `color-mix(in srgb, ${hue} 72%, #120818 28%)` }}>
        <RarityBadge rarity={c.rarity} size="xs" className="battle-sprite__rarity" />
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="battle-foe__sprite" />
      </div>
      <div className={`battle-foe__hp battle-foe__hp--${hpTone(c.hp / c.maxHp)}`}>
        <span style={{ width: `${(c.hp / c.maxHp) * 100}%` }} />
      </div>
      {matchupMult !== undefined && matchupMult >= 2 ? (
        <span className="battle-foe__mult">×2</span>
      ) : matchupMult !== undefined && matchupMult <= 0.5 ? (
        <span className="battle-foe__mult battle-foe__mult--weak">{matchupMult <= 0 ? "×0" : "×½"}</span>
      ) : null}
    </button>
  );
}

function AllyFieldSprite({
  c,
  acting,
  hitFlash,
  inspected,
  onClick,
}: {
  c: Combatant;
  acting: boolean;
  hitFlash?: HitFlashKind;
  inspected?: boolean;
  onClick?: () => void;
}) {
  const hue = combatSpiritHue(c.templateKey);
  return (
    <button
      type="button"
      className={`battle-ally ${acting ? "battle-ally--act" : ""} ${c.ko ? "battle-ally--ko" : ""} ${inspected ? "battle-ally--inspect" : ""} ${hitFlash ? `battle-ally--${hitFlash}` : ""}`}
      onClick={onClick}
      disabled={c.ko || !onClick}
      aria-label={`Inspecter ${c.name}`}
    >
      <div
        className="battle-ally__body"
        style={{ background: `color-mix(in srgb, ${hue} 78%, #1a1028 22%)` }}
      >
        <RarityBadge rarity={c.rarity} size="xs" className="battle-sprite__rarity" />
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="battle-ally__sprite" />
      </div>
    </button>
  );
}

function SoulSlot({
  c,
  ready,
  selected,
  matchupMult,
  onSelect,
}: {
  c: Combatant;
  ready: boolean;
  selected: boolean;
  matchupMult?: number;
  onSelect: () => void;
}) {
  const hpRatio = c.maxHp > 0 ? c.hp / c.maxHp : 0;
  const soulPct = Math.round(c.souls * 100);
  const tribeInfo = TRIBE_INFO[c.tribe];
  const passiveLine = formatPassiveLine(c);
  const hue = combatSpiritHue(c.templateKey);
  return (
    <button
      type="button"
      className={`soul-slot ${ready ? "soul-slot--ready" : ""} ${selected ? "soul-slot--sel" : ""} ${c.ko ? "soul-slot--ko" : ""} ${matchupMult !== undefined && matchupMult >= 2 ? "soul-slot--strong" : ""} ${matchupMult !== undefined && matchupMult <= 0.5 ? "soul-slot--weak" : ""}`}
      onClick={onSelect}
      disabled={c.ko}
      aria-label={`${c.name}, ${tribeInfo.label}, ${c.hp} sur ${c.maxHp} PV, jauge d'âmes ${soulPct} pourcent`}
    >
      <div
        className="soul-slot__portrait"
        style={{ background: `color-mix(in srgb, ${hue} 75%, #000 25%)` }}
      >
        <RarityBadge rarity={c.rarity} size="xs" className="soul-slot__rarity" />
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="soul-slot__sprite" />
      </div>
      <div className="soul-slot__body">
        <div className="soul-slot__head">
          <span className="soul-slot__name">{c.name}</span>
          <span className="soul-slot__tribe">
            {tribeInfo.emoji} {tribeInfo.label}
            {matchupMult !== undefined && matchupMult >= 2 ? " · ×2" : matchupMult !== undefined && matchupMult <= 0.5 ? (matchupMult <= 0 ? " · ×0" : " · ×½") : ""}
          </span>
        </div>
        <div className="soul-slot__stat">
          <span className="soul-slot__stat-lbl">PV</span>
          <div
            className={`soul-slot__hp soul-slot__hp--${hpTone(hpRatio)}`}
            role="progressbar"
            aria-valuenow={c.hp}
            aria-valuemin={0}
            aria-valuemax={c.maxHp}
          >
            <span style={{ width: `${hpRatio * 100}%` }} />
          </div>
          <span className="soul-slot__hp-val">
            {c.hp} / {c.maxHp}
          </span>
        </div>
        <div className="soul-slot__stat soul-slot__stat--souls">
          <span className="soul-slot__stat-lbl">Âmes</span>
          <div className="soul-slot__meter" role="progressbar" aria-valuenow={soulPct} aria-valuemin={0} aria-valuemax={100}>
            <span className="soul-slot__fill" style={{ width: `${soulPct}%` }} />
            {ready ? <span className="soul-slot__flame" aria-hidden /> : null}
          </div>
          <span className="soul-slot__hint">
            {c.ko ? "KO" : ready ? "Amultime !" : `${soulPct} %`}
          </span>
        </div>
        {passiveLine ? <span className="soul-slot__passive">{passiveLine}</span> : null}
        {ready && !c.ko ? (
          <span className="soul-slot__skills">
            <span title={describeSkill(c.skills.special1)}>{c.skills.special1.name}</span>
            <span title={describeSkill(c.skills.special2)}>{c.skills.special2.name}</span>
          </span>
        ) : null}
      </div>
    </button>
  );
}

function StarDisplay({ count }: { count: number }) {
  return (
    <span className="story-stars story-stars--lg">
      {[1, 2, 3].map((i) => (
        <span key={i} className={`story-stars__one ${i <= count ? "story-stars__one--on" : ""}`}>
          ★
        </span>
      ))}
    </span>
  );
}

type StoryPhase = "intro" | "fight" | "result";

export function StoryBattleScreen({ zoneId, levelIndex }: { zoneId: number; levelIndex: number }) {
  const { roster, spiritsByHubId, inventory, refresh: refreshPlayer, hasSpirits } = usePlayer();
  const { isUnlocked } = useStoryProgress();
  const level = getStoryLevelByCoords(zoneId, levelIndex);
  const zone = getStoryZone(zoneId);
  const levelId = level?.id ?? `${zoneId}-${levelIndex}`;
  const unlocked = level ? isUnlocked(levelId, zoneId, levelIndex) : false;

  const allySetup = useMemo(
    () => buildStoryAllySetup(roster, spiritsByHubId),
    [roster, spiritsByHubId],
  );

  const [uiPhase, setUiPhase] = useState<StoryPhase>("intro");
  const [engine, setEngine] = useState<CombatEngine | null>(null);
  const [specialActor, setSpecialActor] = useState<string | null>(null);
  const [specialTarget, setSpecialTarget] = useState<{ actorId: string; slot: 1 | 2 } | null>(null);
  const [inspectTarget, setInspectTarget] = useState<string | null>(null);
  const [inspectAlly, setInspectAlly] = useState<string | null>(null);
  const [showTribeChart, setShowTribeChart] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(1);
  const [renderTick, setRenderTick] = useState(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [hitFlashes, setHitFlashes] = useState<Record<string, HitFlashKind>>({});
  const [resultStars, setResultStars] = useState<0 | 1 | 2 | 3>(0);
  const [resultGold, setResultGold] = useState(0);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [selectedBall, setSelectedBall] = useState<PhantoballType>("standard");
  const [healStock, setHealStock] = useState({ heal_small: 0, heal_medium: 0 });
  const [healMenuOpen, setHealMenuOpen] = useState(false);
  const [healPick, setHealPick] = useState<InventoryItemId | null>(null);

  const lastEventId = useRef(0);
  const engineRef = useRef<CombatEngine | null>(null);
  const speedRef = useRef<BattleSpeed>(1);
  const resultSaved = useRef(false);
  const battleStartInvRef = useRef(inventory);
  const healStockRef = useRef(healStock);

  engineRef.current = engine;
  speedRef.current = battleSpeed;

  const beginFight = () => {
    if (!level || allySetup.length === 0) return;
    resultSaved.current = false;
    setPersistError(null);
    setResultStars(0);
    setResultGold(0);
    battleStartInvRef.current = inventory;
    const heals = healItemsFromInventory(inventory);
    healStockRef.current = heals;
    setHealStock(heals);
    setCaptureTarget(null);
    setHealPick(null);
    setEngine(createStoryBattle(level, allySetup, { runBalls: inventoryToRunBalls(inventory) }));
    trackStoryLevelStarted({ levelId: level.id, zoneId: level.zoneId, index: level.index });
    setUiPhase("fight");
    setSpecialActor(null);
    setSpecialTarget(null);
    setInspectTarget(null);
    setInspectAlly(null);
    lastEventId.current = 0;
    setRenderTick((n) => n + 1);
  };

  const state = engine?.getState();
  const current = engine?.getCurrentActor() ?? null;
  const fieldAllies = state?.combatants.filter((c) => c.side === "ally" && c.active) ?? [];
  const wheelSlots = engine?.getWheelSlots() ?? [];
  const enemies = state?.combatants.filter((c) => c.side === "enemy" && c.active) ?? [];
  const isOver = state?.phase === "lost" || state?.phase === "won";
  const isVictory = state?.phase === "won";
  const isDefeat = state?.phase === "lost";
  const paused = Boolean(
    specialActor ||
      specialTarget ||
      inspectTarget ||
      inspectAlly ||
      showTribeChart ||
      captureTarget ||
      healMenuOpen ||
      healPick ||
      isOver,
  );
  const attackFocusId = state?.attackFocusId ?? null;
  const targetingActorId = specialTarget?.actorId ?? null;
  const targetingActor = targetingActorId ? (engine?.getCombatant(targetingActorId) ?? null) : null;

  const inspectedFoe = inspectTarget ? (engine?.getCombatant(inspectTarget) ?? null) : null;
  const inspectedAlly = inspectAlly ? (engine?.getCombatant(inspectAlly) ?? null) : null;
  const inspectTribe = inspectedFoe && !inspectedFoe.ko ? inspectedFoe.tribe : null;

  const bump = () => setRenderTick((n) => n + 1);

  useEffect(() => {
    if ((!isVictory && !isDefeat) || !engine || !level || resultSaved.current) return;
    resultSaved.current = true;

    const s = engine.getState();
    const allyIds = s.combatants.filter((c) => c.side === "ally").map((c) => c.instanceId);
    const allies = s.combatants.filter((c) => c.side === "ally");
    const stars = isVictory
      ? computeStoryStars(level, {
          phase: s.phase,
          round: s.round,
          events: s.events,
          allyInstanceIds: allyIds,
        })
      : 0;
    setResultStars(stars as 0 | 1 | 2 | 3);

    void (async () => {
      if (isVictory && (stars as number) >= 1) {
        const firstClear = !loadStorySave().levels[level.id]?.cleared;
        const { goldEarned } = await recordStoryVictory(level.id, stars as 1 | 2 | 3, s.round);
        setResultGold(goldEarned);
        trackStoryLevelCompleted({
          levelId: level.id,
          zoneId: level.zoneId,
          index: level.index,
          stars: stars as number,
          firstClear,
          goldEarned,
        });
      }
      try {
        await persistStorySpiritStats(allies, {
          fullHeal: true,
          storyAllies: allySetup,
        });
        await persistPlayerInventory(
          mergeStoryInventoryEnd(
            battleStartInvRef.current,
            runBallsToInventory(s.runBalls),
            healStockRef.current,
          ),
        );
        await refreshPlayer();
      } catch {
        setPersistError("Progression non sauvegardée — réessaie ou reconnecte-toi.");
      }
      setUiPhase("result");
    })();
  }, [isVictory, isDefeat, engine, level, refreshPlayer, allySetup]);

  useEffect(() => {
    if (!engineRef.current) return;
    const eng = engineRef.current;
    const events = eng.getState().events;
    const recent = events.filter((e) => e.id > lastEventId.current);
    lastEventId.current = events.at(-1)?.id ?? lastEventId.current;

    const hits = recent.filter(
      (e): e is CombatEvent & { amount: number; targetId: string } =>
        (e.kind === "attack" || e.kind === "special") &&
        typeof e.amount === "number" &&
        Boolean(e.targetId),
    );
    const kos = recent.filter((e): e is CombatEvent & { targetId: string } => e.kind === "ko" && Boolean(e.targetId));

    const flashUpdates: Record<string, HitFlashKind> = {};
    for (const e of hits) {
      const actor = e.actorId ? eng.getCombatant(e.actorId) : undefined;
      const target = eng.getCombatant(e.targetId);
      const mult = actor && target ? getTypeMultiplier(actor.tribe, target.tribe) : 1;
      flashUpdates[e.targetId] = mult >= 2 ? "super" : "hit";
    }
    for (const e of kos) flashUpdates[e.targetId] = "ko";

    if (hits.length > 0) {
      const next = hits.map((e) => ({ id: e.id, targetId: e.targetId!, amount: e.amount }));
      setFloaters((prev) => [...prev, ...next].slice(-6));
      window.setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => !next.some((n) => n.id === f.id)));
      }, 900);
    }

    if (Object.keys(flashUpdates).length === 0) return;
    setHitFlashes((prev) => ({ ...prev, ...flashUpdates }));
    const t = window.setTimeout(() => {
      setHitFlashes((prev) => {
        const next = { ...prev };
        for (const id of Object.keys(flashUpdates)) delete next[id];
        return next;
      });
    }, 450);
    return () => clearTimeout(t);
  }, [renderTick]);

  useEffect(() => {
    if (!engine || isOver || paused || battleSpeed === 0 || uiPhase !== "fight") return;

    let alive = true;
    let timeout = 0;

    const schedule = () => {
      if (!alive || isOver || paused || speedRef.current === 0) return;
      const eng = engineRef.current;
      if (!eng || eng.getState().phase !== "fighting") return;
      const actor = eng.getCurrentActor();
      const delay = getTickDelayMs(speedRef.current, Boolean(actor));
      timeout = window.setTimeout(() => {
        if (!alive) return;
        eng.tickTurn();
        bump();
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [engine, isOver, paused, battleSpeed, uiPhase]);

  if (!level || !zone) {
    return (
      <div className="page-stub">
        <h1>Niveau introuvable</h1>
        <Link href="/story">Retour à la carte</Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="page-stub">
        <h1>Niveau verrouillé</h1>
        <p>
          Termine les étapes précédentes sur la carte avant d&apos;affronter{" "}
          <strong>{level.title}</strong>.
        </p>
        <Link href="/story" className="play play--story" style={{ marginTop: "1rem" }}>
          Retour à la carte
        </Link>
      </div>
    );
  }

  if (!hasSpirits) {
    return (
      <div className="page-stub">
        <h1>Mode Histoire</h1>
        <Link href="/gacha">Invoquer des esprits</Link>
      </div>
    );
  }

  if (!rosterHasFieldSpirit(roster)) {
    return (
      <div className="page-stub">
        <h1>{level.title}</h1>
        <p>Place au moins un esprit sur la roue du sanctuaire.</p>
        <Link href="/" className="play play--story">
          Sanctuaire
        </Link>
      </div>
    );
  }

  if (uiPhase === "intro") {
    return (
      <div className="story-brief story-brief--with-wheel">
        <p className="story-brief__crumb">
          {zone.emoji} {zone.name} · Niv. {level.index}
        </p>
        <h1 className="story-brief__title">{level.title}</h1>
        <p className="story-brief__text">{level.intro}</p>
        <div className="story-brief__wheel">
          <SpiritWheel
            roster={roster}
            selectedId={null}
            pickSlotIndex={null}
            onSlotClick={() => {}}
            readOnly
            compact
            previewHint="Niveaux et PV = progression histoire · objets depuis /inventory"
          />
        </div>
        <p className="story-brief__loadout">
          Emporté : 🔵 {inventory.ball_standard ?? 0} balls · 🏮 {inventory.heal_small ?? 0} soins
          {(inventory.heal_medium ?? 0) > 0 ? ` · 🔥 ${inventory.heal_medium}` : ""}
          {" · "}
          <Link href="/shop">Boutique</Link>
        </p>
        <div className="story-brief__footer">
          <div className="story-brief__actions">
            <button type="button" className="play play--story" onClick={beginFight}>
              Commencer
            </button>
            <Link href="/story" className="story-brief__back">
              Carte
            </Link>
          </div>
          <p className="story-brief__stars-hint">
            ★ Victoire
            <br />
            ★★ Aucun KO
            <br />
            ★★★ ≤ {level.starsRound3} rounds
          </p>
        </div>
      </div>
    );
  }

  if (uiPhase === "result") {
    return (
      <div className="story-result">
        <h1>{isVictory ? "Victoire !" : "Défaite…"}</h1>
        {isVictory ? (
          <>
            <StarDisplay count={resultStars} />
            <p className="story-result__text">{level.outro}</p>
            <p className="story-result__meta">Round {state?.round ?? "—"} · progression histoire sauvegardée</p>
            {resultGold > 0 ? (
              <p className="story-result__gold">+{resultGold.toLocaleString("fr-FR")} 🪙 or</p>
            ) : null}
          </>
        ) : (
          <p className="story-result__text">Retente le niveau — ta collection n&apos;est pas perdue.</p>
        )}
        {persistError ? <p className="story-result__error">{persistError}</p> : null}
        <div className="story-brief__actions">
          <button type="button" className="play play--story" onClick={() => setUiPhase("intro")}>
            {isVictory ? "Rejouer" : "Réessayer"}
          </button>
          <Link href="/story" className="story-brief__back">
            Carte
          </Link>
        </div>
      </div>
    );
  }

  if (!engine || !state) return null;

  const runBalls = state.runBalls;
  const pendingRecruit = state.pendingRecruit;
  const weakEnemy = enemies.find((c) => !c.ko && c.hp / c.maxHp <= 0.4) ?? null;
  const hasHeals = healStock.heal_small > 0 || healStock.heal_medium > 0;
  const captureConfirm = captureTarget ? (engine.getCombatant(captureTarget) ?? null) : null;
  const captureConfirmChance = captureConfirm
    ? Math.round(
        computeCaptureChance(
          captureConfirm.rarity,
          captureConfirm.hp / captureConfirm.maxHp,
          selectedBall,
          state.runModifiers.captureBonus,
          captureConfirm.tribe,
        ) * 100,
      )
    : 0;
  const selectedBallAvailable = captureConfirm
    ? selectedBall === "standard"
      ? runBalls.standard > 0
      : (runBalls.tribal[selectedBall] ?? 0) > 0
    : false;

  const handleCapture = () => {
    if (!engine || !captureTarget || isOver) return;
    const target = engine.getCombatant(captureTarget);
    if (!target || target.ko) return;
    const ball = selectedBall;
    const hasBall =
      ball === "standard" ? runBalls.standard > 0 : (runBalls.tribal[ball] ?? 0) > 0;
    if (!hasBall) return;
    if (!engine.tryCapture(captureTarget, ball)) return;
    setCaptureTarget(null);
    setInspectTarget(null);
    bump();
  };

  const handleHealAlly = (allyId: string) => {
    if (!engine || !healPick || isOver) return;
    const def = INVENTORY_CATALOG[healPick];
    if (!def.healPct) return;
    const stock = healStockRef.current[healPick as "heal_small" | "heal_medium"] ?? 0;
    if (stock <= 0) return;
    if (!engine.healAlly(allyId, def.healPct)) return;
    const next = { ...healStockRef.current, [healPick]: stock - 1 };
    healStockRef.current = next;
    setHealStock(next);
    setHealPick(null);
    setInspectAlly(null);
    bump();
  };

  const handleEnemyClick = (foeId: string) => {
    if (!engine || isOver) return;
    const foe = engine.getCombatant(foeId);
    if (!foe || foe.ko) return;
    if (specialTarget) {
      engine.playerSpecial(specialTarget.actorId, specialTarget.slot, foeId);
      setSpecialTarget(null);
      setInspectTarget(null);
      bump();
      return;
    }
    setInspectTarget((id) => (id === foeId ? null : foeId));
    setInspectAlly(null);
  };

  const handleEnemyFocus = (foeId: string) => {
    if (!engine || isOver || specialTarget) return;
    engine.setAttackFocus(foeId);
    bump();
  };

  const handlePickSpecial = (slot: 1 | 2) => {
    if (!engine || !specialActor || isOver) return;
    const actor = engine.getCombatant(specialActor);
    if (!actor) return;
    const skill = actor.skills[slot === 1 ? "special1" : "special2"];
    if (skill.targeting === "single") {
      setSpecialTarget({ actorId: specialActor, slot });
      setSpecialActor(null);
      return;
    }
    engine.playerSpecial(specialActor, slot);
    setSpecialActor(null);
    bump();
  };

  const handleAllyInspect = (allyId: string) => {
    if (!engine || isOver) return;
    const ally = engine.getCombatant(allyId);
    if (!ally || ally.ko || ally.side !== "ally") return;
    if (healPick) {
      handleHealAlly(allyId);
      return;
    }
    setInspectAlly((id) => (id === allyId ? null : allyId));
    setInspectTarget(null);
    setShowTribeChart(false);
  };

  const wheelFilled = wheelSlots.filter(Boolean).length;
  const wheelOnField = wheelSlots.filter((s) => s?.active && !s.ko).length;
  const showAllyFiche =
    inspectedAlly &&
    !inspectedAlly.ko &&
    !showTribeChart &&
    !specialTarget &&
    !specialActor &&
    !isOver &&
    !healMenuOpen &&
    !healPick;

  const renderSoulSlots = (className: string) =>
    fieldAllies.map((c) => (
      <SoulSlot
        key={`${className}-${c.instanceId}`}
        c={c}
        ready={c.souls >= 1 && !c.ko}
        selected={specialActor === c.instanceId}
        matchupMult={inspectTribe ? getTypeMultiplier(c.tribe, inspectTribe) : undefined}
        onSelect={() => {
          if (c.ko || isOver) return;
          if (c.souls >= 1) {
            setSpecialActor((id) => (id === c.instanceId ? null : c.instanceId));
            setInspectAlly(null);
            return;
          }
          handleAllyInspect(c.instanceId);
        }}
      />
    ));

  return (
    <div className={`battle battle--story ${isOver ? "battle--over" : ""}`}>
      <div className="battle__main">
        <div className="battle__field">
          <div className="battle__sky" />
          <div className="battle__ground" />

          <div className="battle__top">
            <div className="battle__top-row">
              <div className="battle__top-left">
                <div className="battle__wheel-meta">
                  <span className="battle__wheel-title">Roue</span>
                  <span className="battle__wheel-count">
                    {wheelOnField}/{MAX_FIELD} terrain · {wheelFilled}/6
                  </span>
                </div>
                <span className="battle__wave-badge battle__wave-badge--story">
                  {zone.emoji} {level.title}
                </span>
                <span className="battle__wave battle__wave--story">
                  {zone.emoji} {level.title}
                </span>
              </div>
              <div className="battle__top-center">
                {current && !isOver ? (
                  <span className="battle__turn">{current.name} agit…</span>
                ) : (
                  <span className="battle__turn battle__turn--idle">Histoire</span>
                )}
              </div>
              <div className="battle__top-right">
                <span className="battle__balls">
                  🔵{runBalls.standard}
                  {totalTribalBalls(runBalls) > 0 ? ` · +${totalTribalBalls(runBalls)} trib.` : ""}
                </span>
                <span className="battle__balls">R.{state.round}</span>
                <BattleSpeedControls speed={battleSpeed} onChange={setBattleSpeed} disabled={isOver} />
                <button
                  type="button"
                  className="battle__tribes-btn battle__tribes-btn--desktop"
                  disabled={isOver}
                  onClick={() => setShowTribeChart((v) => !v)}
                >
                  Tribus
                </button>
                <Link href="/story" className="battle__quit battle__quit--desktop">
                  Quitter
                </Link>
              </div>
            </div>
            <div className="battle__top-actions">
              <button
                type="button"
                className="battle__tribes-btn battle__tribes-btn--mobile"
                disabled={isOver}
                onClick={() => setShowTribeChart((v) => !v)}
              >
                Tribus
              </button>
              <Link href="/story" className="battle__quit battle__quit--mobile">
                Quitter
              </Link>
            </div>
          </div>

          {weakEnemy && !isOver && !captureTarget && hasAnyBall(runBalls) ? (
            <button
              type="button"
              className="battle__capture-fab"
              onClick={() => {
                setCaptureTarget(weakEnemy.instanceId);
                setInspectTarget(null);
              }}
            >
              Phantoball
            </button>
          ) : null}

          <div className="battle__enemies">
            {enemies.map((c) => {
              const inTargetMode = Boolean(specialTarget && !c.ko);
              const focused = attackFocusId === c.instanceId;
              const mult =
                inTargetMode && targetingActor
                  ? getTypeMultiplier(targetingActor.tribe, c.tribe)
                  : focused && current?.side === "ally"
                    ? getTypeMultiplier(current.tribe, c.tribe)
                    : undefined;
              return (
                <EnemyFieldSprite
                  key={c.instanceId}
                  c={c}
                  inspected={inspectTarget === c.instanceId}
                  targetable={inTargetMode}
                  focused={focused}
                  matchupMult={mult}
                  onClick={!c.ko && !isOver ? () => handleEnemyClick(c.instanceId) : undefined}
                  onContextMenu={!c.ko && !isOver ? () => handleEnemyFocus(c.instanceId) : undefined}
                />
              );
            })}
          </div>

          <div className="battle__allies" aria-label="Équipe">
            {fieldAllies.map((c) => (
              <AllyFieldSprite
                key={c.instanceId}
                c={c}
                acting={current?.instanceId === c.instanceId}
                hitFlash={hitFlashes[c.instanceId]}
                inspected={inspectAlly === c.instanceId}
                onClick={!c.ko && !isOver ? () => handleAllyInspect(c.instanceId) : undefined}
              />
            ))}
          </div>

          {floaters.map((f) => (
            <span key={f.id} className="battle__floater">
              −{f.amount}
            </span>
          ))}
        </div>

        <footer className="battle__footer">
          <p className="battle__hint">
            <span className="battle__tip battle__tip--desktop">
              Clic droit = cibler · jauge pleine = amultime
              {hasHeals ? " · Objets = soins" : ""}
            </span>
            <span className="battle__tip battle__tip--mobile">
              Fiche → 🎯 Cibler · jauge pleine = amultime
              {hasHeals ? " · Objets = soins" : ""}
            </span>
          </p>
          <div className="battle__footer-actions">
            {hasHeals ? (
              <button
                type="button"
                className="battle__items-btn"
                disabled={isOver}
                onClick={() => {
                  setHealMenuOpen(true);
                  setInspectAlly(null);
                }}
              >
                🏮 Objets ({healStock.heal_small + healStock.heal_medium})
              </button>
            ) : null}
          </div>
          <div className="battle__slots battle__slots--hud" aria-label="Jauges d'âmes">
            {renderSoulSlots("hud")}
          </div>
        </footer>
      </div>

      <div className="battle__deck" aria-label="Deck">
        <div className="battle__fiche">
          {showAllyFiche && inspectedAlly ? (
            <AllyInspect
              ally={inspectedAlly}
              onClose={() => setInspectAlly(null)}
              className="foe-inspect--in-deck"
            />
          ) : (
            <div className="battle__slots battle__slots--deck" aria-label="Jauges d'âmes">
              {renderSoulSlots("deck")}
            </div>
          )}
        </div>
        <BattleWheel
          slots={wheelSlots}
          currentId={current?.side === "ally" ? current.instanceId : null}
          canRotate={!isOver && !paused}
          onRotate={(dir) => {
            engine.rotateWheel(dir);
            bump();
          }}
          placementMode={Boolean(pendingRecruit)}
          pendingRecruit={pendingRecruit}
          onPickSlot={(idx) => {
            engine.completeCapturePlacement(idx);
            bump();
          }}
          relicIds={[]}
        />
      </div>

      {showAllyFiche && inspectedAlly ? (
        <AllyInspect
          ally={inspectedAlly}
          onClose={() => setInspectAlly(null)}
          className="foe-inspect--on-desktop"
        />
      ) : null}

      {inspectedFoe && !isOver ? (
        <FoeInspect
          foe={inspectedFoe}
          fieldAllies={fieldAllies}
          onClose={() => setInspectTarget(null)}
          onOpenChart={() => setShowTribeChart(true)}
          onFocusTarget={() => handleEnemyFocus(inspectedFoe.instanceId)}
          focused={attackFocusId === inspectedFoe.instanceId}
          onCapture={
            !inspectedFoe.ko &&
            inspectedFoe.hp / inspectedFoe.maxHp <= 0.4 &&
            hasAnyBall(runBalls)
              ? () => setCaptureTarget(inspectedFoe.instanceId)
              : undefined
          }
        />
      ) : null}

      {showTribeChart && !isOver ? (
        <div className="battle__overlay battle__overlay--panel">
          <TribeChart focusDefender={inspectTribe} onClose={() => setShowTribeChart(false)} />
        </div>
      ) : null}

      {specialActor && !isOver ? (
        <div className="battle__overlay">
          <div className="battle__spe-menu">
            <p className="battle__spe-title">{engine.getCombatant(specialActor)?.name} — Amultime</p>
            {[1, 2].map((slot) => {
              const actor = engine.getCombatant(specialActor);
              if (!actor) return null;
              const skill = actor.skills[slot === 1 ? "special1" : "special2"];
              return (
                <button key={slot} type="button" className="battle__spe-btn" onClick={() => handlePickSpecial(slot as 1 | 2)}>
                  <span className="battle__spe-btn-name">{skill.name}</span>
                  <span className="battle__spe-btn-desc">{describeSkill(skill)}</span>
                </button>
              );
            })}
            <button type="button" className="battle__spe-cancel" onClick={() => setSpecialActor(null)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {healMenuOpen && !isOver ? (
        <div className="battle__overlay battle__overlay--dim" role="dialog" aria-label="Objets">
          <div className="battle__spe-menu">
            <p className="battle__spe-title">Utiliser un objet</p>
            {(["heal_small", "heal_medium"] as const).map((id) => {
              const def = INVENTORY_CATALOG[id];
              const qty = healStock[id];
              if (qty <= 0) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="battle__spe-btn"
                  onClick={() => {
                    setHealPick(id);
                    setHealMenuOpen(false);
                  }}
                >
                  <span className="battle__spe-btn-name">
                    {def.emoji} {def.name} ×{qty}
                  </span>
                  <span className="battle__spe-btn-desc">{def.description}</span>
                </button>
              );
            })}
            <button type="button" className="battle__spe-cancel" onClick={() => setHealMenuOpen(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {healPick && !isOver ? (
        <div className="battle__items-hint">Clique un allié pour {INVENTORY_CATALOG[healPick].name}</div>
      ) : null}

      {captureTarget && captureConfirm && !isOver ? (
        <div className="battle__overlay battle__overlay--dim" role="dialog" aria-label="Capture">
          <div className="battle__spe-menu battle__spe-menu--capture">
            <p className="battle__spe-title">Capturer {captureConfirm.name} ?</p>
            <p className="battle__capture-chance">Chance : {captureConfirmChance} %</p>
            <div className="battle__ball-pick" role="group" aria-label="Type de Phantoball">
              {runBalls.standard > 0 ? (
                <button
                  type="button"
                  className={`battle__ball-opt ${selectedBall === "standard" ? "battle__ball-opt--on" : ""}`}
                  onClick={() => setSelectedBall("standard")}
                >
                  🔵 Standard ×{runBalls.standard}
                </button>
              ) : null}
              {TRIBAL_BALL_IDS.map((id) => {
                const count = runBalls.tribal[id] ?? 0;
                if (count <= 0) return null;
                const info = TRIBAL_BALL_INFO[id];
                const matches = tribalBallMatches(id, captureConfirm.tribe);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`battle__ball-opt ${selectedBall === id ? "battle__ball-opt--on" : ""} ${matches ? "battle__ball-opt--match" : ""}`}
                    onClick={() => setSelectedBall(id)}
                  >
                    {info.emoji} {info.name} ×{count}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="battle__spe-btn battle__spe-btn--ball"
              onClick={handleCapture}
              disabled={!selectedBallAvailable}
            >
              Lancer la Phantoball
            </button>
            <button type="button" className="battle__spe-cancel" onClick={() => setCaptureTarget(null)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
