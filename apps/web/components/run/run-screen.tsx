"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RunEndRecap } from "./run-end-recap";
import { useSearchParams } from "next/navigation";
import {
  createRunBattle,
  computeCaptureChance,
  type RunMetaReward,
  RUN_STARTER_WHEEL_INDEX,
  TRIBE_INFO,
  getTypeMultiplier,
  RUN_MAX_WAVES,
  MAX_FIELD,
  getRunWaveKind,
  getRunWaveKindLabel,
  TRIBAL_BALL_IDS,
  TRIBAL_BALL_INFO,
  hasAnyBall,
  totalTribalBalls,
  tribalBallMatches,
  createEmptyTribalStock,
  bestTribalBallFor,
  type CombatEvent,
  type Combatant,
  type PhantoballType,
  describeSkill,
  formatPassiveLine,
  CombatEngine,
} from "@phantoria/game-core";
import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { isSpiritId, type SpiritId } from "@/components/hub/roster";
import { BattleWheel } from "@/components/run/battle-wheel";
import {
  CaptureSequence,
  CAPTURE_PHASE_MS,
  type CapturePhase,
  type CaptureSeqState,
} from "@/components/run/capture-sequence";
import { RunStarterPicker, starterCoreKey } from "@/components/run/run-starter-picker";
import { ownedSpiritStarters, usePlayer } from "@/components/providers/player-provider";
import { CORE_TO_HUB } from "@/components/run/wheel-map";
import { CombatSpirit, combatSpiritHue } from "@/components/run/combat-spirit";
import { FoeInspect } from "@/components/run/foe-inspect";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { TribeChart } from "@/components/run/tribe-chart";
import { WaveRewardPicker } from "@/components/run/wave-reward-picker";
import { BattleSpeedControls, getTickDelayMs, type BattleSpeed } from "@/components/run/battle-speed-controls";
import { AllyInspect } from "@/components/run/ally-inspect";
import { RunDevPanel } from "@/components/run/run-dev-panel";
import "./run.css";
import { claimRunMetaReward } from "@/lib/player/run-meta-client";
import { recordDailyRun } from "@/lib/quests/quest-progress";
import { incrementLocalRunsCompleted } from "@/lib/player/run-stats-local";
import { clearSavedRun, getSavedRunSummary, loadSavedRun, saveRun } from "@/lib/run-persistence";

const CORE_TO_HUB_MAP = CORE_TO_HUB;

type Floater = { id: number; targetId: string; amount: number };
type HitFlashKind = "hit" | "super" | "ko";

function hubIdOf(c: Combatant): SpiritId | null {
  const id = CORE_TO_HUB_MAP[c.templateKey];
  return id && isSpiritId(id) ? id : null;
}

function hpTone(ratio: number) {
  if (ratio >= 0.6) return "ok";
  if (ratio >= 0.3) return "warn";
  return "low";
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
  captureSelected,
  capturePhase,
  matchupMult,
  onClick,
  onContextMenu,
  floater,
  hitFlash,
}: {
  c: Combatant;
  inspected: boolean;
  targetable?: boolean;
  focused?: boolean;
  captureSelected: boolean;
  capturePhase?: CapturePhase | null;
  matchupMult?: number;
  onClick?: () => void;
  onContextMenu?: () => void;
  floater?: Floater;
  hitFlash?: HitFlashKind;
}) {
  const ratio = c.maxHp > 0 ? c.hp / c.maxHp : 0;
  const capClass = capturePhase ? `battle-foe--cap-${capturePhase}` : "";
  const tribeInfo = TRIBE_INFO[c.tribe];
  const hue = combatSpiritHue(c.templateKey);

  return (
    <button
      type="button"
      className={`battle-foe ${inspected ? "battle-foe--inspect" : ""} ${targetable ? "battle-foe--target" : ""} ${focused ? "battle-foe--focus" : ""} ${captureSelected ? "battle-foe--sel" : ""} ${c.ko ? "battle-foe--ko" : ""} ${hitFlash ? `battle-foe--${hitFlash}` : ""} ${capClass}`}
      onClick={onClick}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        e.preventDefault();
        onContextMenu();
      }}
      disabled={(!onClick && !onContextMenu) || c.ko || Boolean(capturePhase)}
      aria-label={`${c.name}, ${tribeInfo.label}, ${Math.round(ratio * 100)} pourcent PV`}
    >
      {matchupMult !== undefined && matchupMult >= 2 ? (
        <span className="battle-foe__matchup battle-foe__matchup--up" aria-hidden>
          ×2
        </span>
      ) : null}
      {matchupMult !== undefined && matchupMult <= 0.5 && matchupMult > 0 ? (
        <span className="battle-foe__matchup battle-foe__matchup--down" aria-hidden>
          ×½
        </span>
      ) : null}
      <div className="battle-foe__hp">
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
      <div
        className="battle-foe__body"
        style={{ background: `color-mix(in srgb, ${hue} 78%, #1a1028 22%)` }}
      >
        <RarityBadge rarity={c.rarity} size="xs" className="battle-sprite__rarity" />
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="battle-foe__sprite" />
      </div>
      <span className="battle-foe__tribe">
        {tribeInfo.emoji} {tribeInfo.label} · {c.rarity}
      </span>
      {floater ? (
        <span className="battle-foe__dmg" key={floater.id}>
          −{floater.amount}
        </span>
      ) : null}
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

export function RunScreen() {
  const { unlockedHubIds, spiritsByHubId, refresh: refreshPlayer, user, supabaseEnabled } =
    usePlayer();
  const starters = useMemo(
    () => ownedSpiritStarters(unlockedHubIds, spiritsByHubId),
    [unlockedHubIds, spiritsByHubId],
  );
  const [engine, setEngine] = useState<CombatEngine | null>(null);
  const [specialActor, setSpecialActor] = useState<string | null>(null);
  const [specialTarget, setSpecialTarget] = useState<{ actorId: string; slot: 1 | 2 } | null>(null);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [inspectTarget, setInspectTarget] = useState<string | null>(null);
  const [inspectAlly, setInspectAlly] = useState<string | null>(null);
  const [savedSummary, setSavedSummary] = useState<{
    wave: number;
    phase: "fighting" | "reward_pick";
  } | null>(null);
  const [showTribeChart, setShowTribeChart] = useState(false);
  const [captureSeq, setCaptureSeq] = useState<CaptureSeqState | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [hitFlashes, setHitFlashes] = useState<Record<string, HitFlashKind>>({});
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(1);
  const [selectedBall, setSelectedBall] = useState<PhantoballType>("standard");
  const [renderTick, setRenderTick] = useState(0);
  const lastEventId = useRef(0);
  const engineRef = useRef<CombatEngine | null>(null);
  const pausedRef = useRef(false);
  const isOverRef = useRef(false);
  const speedRef = useRef<BattleSpeed>(1);
  const searchParams = useSearchParams();
  const showDevTools = process.env.NODE_ENV === "development" || searchParams.get("dev") === "1";

  engineRef.current = engine;

  useEffect(() => {
    void getSavedRunSummary().then(setSavedSummary);
  }, []);

  const beginRun = (starterId: SpiritId) => {
    void clearSavedRun();
    setSavedSummary(null);
    setEngine(
      createRunBattle({
        allySetup: [{ key: starterCoreKey(starterId), wheelIndex: RUN_STARTER_WHEEL_INDEX }],
      }),
    );
    setSpecialActor(null);
    setSpecialTarget(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setInspectAlly(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
    setRenderTick((n) => n + 1);
  };

  const resumeRun = () => {
    void loadSavedRun().then((saved) => {
      if (!saved) return;
      setEngine(CombatEngine.restore(saved));
      setSpecialActor(null);
      setSpecialTarget(null);
      setCaptureTarget(null);
      setInspectTarget(null);
      setInspectAlly(null);
      setShowTribeChart(false);
      setFloaters([]);
      lastEventId.current = saved.events.at(-1)?.id ?? 0;
      setRenderTick((n) => n + 1);
    });
  };

  const state = engine?.getState();
  const current = engine?.getCurrentActor() ?? null;
  const fieldAllies = state?.combatants.filter((c) => c.side === "ally" && c.active) ?? [];
  const wheelSlots = engine?.getWheelSlots() ?? [];
  const enemies = state?.combatants.filter((c) => c.side === "enemy" && c.active) ?? [];
  const livingEnemies = enemies.filter((c) => !c.ko);
  const pendingRecruit = state?.pendingRecruit ?? null;
  const paused = Boolean(
    specialActor ||
      specialTarget ||
      captureTarget ||
      pendingRecruit ||
      captureSeq ||
      state?.phase === "reward_pick" ||
      state?.phase === "lost" ||
      state?.phase === "won",
  );
  const isOver = state?.phase === "lost" || state?.phase === "won";
  const isVictory = state?.phase === "won";
  const isDefeat = state?.phase === "lost";
  const isRewardPick = state?.phase === "reward_pick";
  const attackFocusId = state?.attackFocusId ?? null;
  const targetingActorId = specialTarget?.actorId ?? null;
  const targetingActor = targetingActorId ? engine?.getCombatant(targetingActorId) ?? null : null;
  const waveKind = state ? getRunWaveKind(state.wave) : "normal";
  const waveKindLabel = getRunWaveKindLabel(waveKind);
  const isBossWave = waveKind !== "normal";
  const rewardChoices = state?.rewardChoices ?? null;
  const shopOffers = state?.shopOffers ?? [];
  const freeRewardPicked = state?.freeRewardPicked ?? false;
  const runGold = state?.runGold ?? 0;
  const runBalls = state?.runBalls ?? { standard: 0, tribal: createEmptyTribalStock() };
  const shopRerollCount = state?.shopRerollCount ?? 0;
  const runRelics = state?.runRelics ?? [];
  const captureBonus = state?.runModifiers.captureBonus ?? 0;

  const inspectedFoe = inspectTarget ? engine?.getCombatant(inspectTarget) ?? null : null;
  const inspectedAlly = inspectAlly ? engine?.getCombatant(inspectAlly) ?? null : null;
  const inspectTribe = inspectedFoe && !inspectedFoe.ko ? inspectedFoe.tribe : null;

  pausedRef.current = paused;
  isOverRef.current = isOver;
  speedRef.current = battleSpeed;

  const bump = () => setRenderTick((n) => n + 1);

  const [metaReward, setMetaReward] = useState<RunMetaReward | null>(null);
  const [metaGrantError, setMetaGrantError] = useState<string | null>(null);
  const [metaPending, setMetaPending] = useState(false);
  const metaGrantRef = useRef(false);

  useEffect(() => {
    if (!isOver || !engine || metaGrantRef.current) return;
    metaGrantRef.current = true;
    recordDailyRun();

    const state = engine.getState();
    const outcome = state.phase === "won" ? "won" : "lost";

    void (async () => {
      setMetaGrantError(null);
      setMetaPending(true);
      await saveRun(state);

      if (supabaseEnabled && user) {
        const { reward, error: grantError } = await claimRunMetaReward(state.wave, outcome);
        if (grantError) {
          setMetaGrantError(grantError);
        } else if (reward) {
          setMetaReward(reward);
        }
        await refreshPlayer();
      } else if (supabaseEnabled && !user) {
        setMetaGrantError("Connecte-toi pour récupérer tickets et gemmes sur ton compte.");
        incrementLocalRunsCompleted();
      } else {
        incrementLocalRunsCompleted();
        await refreshPlayer();
      }

      setMetaPending(false);

      setSpecialActor(null);
      setSpecialTarget(null);
      setCaptureTarget(null);
      setInspectTarget(null);
      setInspectAlly(null);
      setShowTribeChart(false);
      setCaptureSeq(null);
      await clearSavedRun();
      setSavedSummary(null);
    })();
  }, [isOver, engine, refreshPlayer, supabaseEnabled, user]);

  useEffect(() => {
    if (!engine || isOver) return;
    void saveRun(engine.getState()).then(() => {
      void getSavedRunSummary().then(setSavedSummary);
    });
  }, [engine, renderTick, isOver]);

  const weakEnemy =
    !isOver && hasAnyBall(runBalls)
      ? livingEnemies.find((e) => e.hp / e.maxHp <= 0.4)
      : undefined;

  useEffect(() => {
    if (!captureTarget || !engineRef.current) return;
    const target = engineRef.current.getCombatant(captureTarget);
    if (!target) return;
    const balls = engineRef.current.getState().runBalls;
    const best = bestTribalBallFor(balls, target.tribe);
    if (best && best.mult >= 1.5) setSelectedBall(best.id);
    else if (balls.standard > 0) setSelectedBall("standard");
    else if (best) setSelectedBall(best.id);
  }, [captureTarget]);

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
      const mult =
        actor && target ? getTypeMultiplier(actor.tribe, target.tribe) : 1;
      flashUpdates[e.targetId] = mult >= 2 ? "super" : "hit";
    }
    for (const e of kos) {
      flashUpdates[e.targetId] = "ko";
    }

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
    if (!captureSeq) return;

    const next =
      captureSeq.phase === "flight"
        ? "shake"
        : captureSeq.phase === "shake"
          ? captureSeq.success
            ? "success"
            : "fail"
          : null;

    if (!next) return;

    const delay = CAPTURE_PHASE_MS[captureSeq.phase];
    const t = window.setTimeout(() => {
      setCaptureSeq((s) => (s ? { ...s, phase: next } : null));
      bump();
    }, delay);

    return () => window.clearTimeout(t);
  }, [captureSeq?.phase, captureSeq?.targetId]);

  useEffect(() => {
    if (!captureSeq || captureSeq.phase !== "success" && captureSeq.phase !== "fail") return;

    const t = window.setTimeout(() => {
      setCaptureSeq(null);
      bump();
    }, CAPTURE_PHASE_MS[captureSeq.phase]);

    return () => window.clearTimeout(t);
  }, [captureSeq?.phase, captureSeq?.targetId]);

  useEffect(() => {
    if (!engine || isOver || paused || battleSpeed === 0) return;

    let alive = true;
    let timeout = 0;

    const schedule = () => {
      if (!alive || isOverRef.current || pausedRef.current || speedRef.current === 0) return;

      const eng = engineRef.current;
      if (!eng || eng.getState().phase !== "fighting") return;

      const actor = eng.getCurrentActor();
      const delay = getTickDelayMs(speedRef.current, Boolean(actor));
      if (delay <= 0) return;

      timeout = window.setTimeout(() => {
        if (!alive || isOverRef.current || pausedRef.current || speedRef.current === 0) return;
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
  }, [engine, isOver, paused, battleSpeed]);

  const handleEnemyClick = (foeId: string) => {
    if (!engine || isOver || isRewardPick) return;
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
    setShowTribeChart(false);
  };

  const handleAllyInspect = (allyId: string) => {
    if (!engine || isOver || isRewardPick) return;
    const ally = engine.getCombatant(allyId);
    if (!ally || ally.ko || ally.side !== "ally") return;
    setInspectAlly((id) => (id === allyId ? null : allyId));
    setInspectTarget(null);
    setShowTribeChart(false);
  };

  const handleEnemyFocus = (foeId: string) => {
    if (!engine || isOver || isRewardPick || captureSeq || specialTarget) return;
    const foe = engine.getCombatant(foeId);
    if (!foe || foe.ko) return;
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
      setInspectTarget(null);
      return;
    }

    engine.playerSpecial(specialActor, slot);
    setSpecialActor(null);
    bump();
  };

  const cancelTargeting = () => {
    setSpecialTarget(null);
    setInspectTarget(null);
  };

  const handleCapture = () => {
    if (!engine || !captureTarget || isOver) return;
    const target = engine.getCombatant(captureTarget);
    if (!target || target.ko) return;

    const balls = engine.getState().runBalls;
    const ball = selectedBall;
    const hasBall =
      ball === "standard" ? balls.standard > 0 : (balls.tribal[ball] ?? 0) > 0;
    if (!hasBall) return;

    const hpRatio = target.hp / target.maxHp;
    const chancePct = Math.round(
      computeCaptureChance(
        target.rarity,
        hpRatio,
        ball,
        engine.getState().runModifiers.captureBonus,
        target.tribe,
      ) * 100,
    );
    const targetId = captureTarget;
    const targetName = target.name;

    const success = engine.tryCapture(targetId, ball);
    if (!success) return;

    setCaptureTarget(null);
    setInspectTarget(null);
    setInspectAlly(null);
    setShowTribeChart(false);
    setCaptureSeq({
      targetId,
      targetName,
      chancePct,
      phase: "flight",
      success,
    });

    bump();
  };

  const handlePlacement = (wheelIndex: number) => {
    if (!engine || isOver) return;
    engine.completeCapturePlacement(wheelIndex);
    bump();
  };

  const handleRotate = (dir: "cw" | "ccw") => {
    if (!engine || isOver) return;
    engine.rotateWheel(dir);
    bump();
  };

  const handleSelectReward = (rewardId: string) => {
    if (!engine) return;
    engine.selectReward(rewardId);
    bump();
  };

  const handleBuyShop = (rewardId: string) => {
    if (!engine) return;
    engine.buyShopOffer(rewardId);
    bump();
  };

  const handleRerollShop = () => {
    if (!engine) return;
    engine.rerollShop();
    bump();
  };

  const handleContinueAfterReward = () => {
    if (!engine) return;
    engine.continueAfterReward();
    setSpecialActor(null);
    setSpecialTarget(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setInspectAlly(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
    bump();
  };

  const restart = () => {
    metaGrantRef.current = false;
    setMetaReward(null);
    setMetaGrantError(null);
    clearSavedRun();
    setSavedSummary(null);
    setEngine(null);
    setSpecialActor(null);
    setSpecialTarget(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setInspectAlly(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
  };

  if (!engine || !state) {
    return (
      <RunStarterPicker
        onPick={beginRun}
        onContinue={resumeRun}
        savedSummary={savedSummary}
        starters={starters}
      />
    );
  }

  const actor = specialActor ? engine.getCombatant(specialActor) : null;
  const captureConfirm = captureTarget ? engine.getCombatant(captureTarget) : null;
  const captureConfirmChance = captureConfirm
    ? Math.round(
        computeCaptureChance(
          captureConfirm.rarity,
          captureConfirm.hp / captureConfirm.maxHp,
          selectedBall,
          captureBonus,
          captureConfirm.tribe,
        ) * 100,
      )
    : 0;

  const selectedBallAvailable =
    selectedBall === "standard"
      ? runBalls.standard > 0
      : (runBalls.tribal[selectedBall] ?? 0) > 0;

  const wheelFilled = wheelSlots.filter(Boolean).length;
  const wheelOnField = wheelSlots.filter((s) => s?.active && !s.ko).length;
  const showAllyFiche =
    inspectedAlly &&
    !inspectedAlly.ko &&
    !showTribeChart &&
    !isRewardPick &&
    !specialTarget &&
    !specialActor &&
    !isOver;

  return (
    <div className={`battle ${isOver ? "battle--over" : ""}`}>
      <div className="battle__main">
      <div className="battle__field">
        <div className="battle__sky" />
        <div className="battle__ground" />

        <div className="battle__top">
          <div className="battle__top-row">
            <div className="battle__top-left">
              <div className="battle__wheel-meta" aria-hidden={false}>
                <span className="battle__wheel-title">Roue</span>
                <span className="battle__wheel-count">
                  {wheelOnField}/{MAX_FIELD} terrain · {wheelFilled}/6
                </span>
              </div>
              <span className="battle__wave-badge">
                {isBossWave ? (
                  <span className={`battle__wave-tag battle__wave-tag--${waveKind}`}>{waveKindLabel}</span>
                ) : null}
                {state.wave}/{RUN_MAX_WAVES}
              </span>
              <span className="battle__wave">
                {isBossWave ? (
                  <span className={`battle__wave-tag battle__wave-tag--${waveKind}`}>{waveKindLabel}</span>
                ) : null}
                {state.wave}/{RUN_MAX_WAVES}
              </span>
            </div>
            <div className="battle__top-center">
              {specialTarget && targetingActor ? (
                <span className="battle__turn battle__turn--target">
                  {targetingActor.name} — cible pour{" "}
                  {targetingActor.skills[specialTarget.slot === 1 ? "special1" : "special2"].name}
                </span>
              ) : current && !isOver && !isRewardPick ? (
                <span className="battle__turn">{current.name} agit…</span>
              ) : (
                <span className="battle__turn battle__turn--idle">Combat</span>
              )}
            </div>
            <div className="battle__top-right">
              <span className="battle__balls" aria-label="Phantoballs">
                🔵{runBalls.standard}
                {totalTribalBalls(runBalls) > 0 ? ` · +${totalTribalBalls(runBalls)} trib.` : ""}
              </span>
              <span className="battle__gold" aria-label={`${runGold} euros`}>
                {runGold} €
              </span>
              <BattleSpeedControls
                speed={battleSpeed}
                onChange={setBattleSpeed}
                disabled={isOver || isRewardPick}
              />
              {specialTarget ? (
                <button type="button" className="battle__cancel-target" onClick={cancelTargeting}>
                  Annuler
                </button>
              ) : null}
              <button
                type="button"
                className="battle__tribes-btn battle__tribes-btn--desktop"
                disabled={isOver || isRewardPick}
                onClick={() => {
                  if (isOver || isRewardPick) return;
                  setShowTribeChart((v) => !v);
                  if (showTribeChart) setInspectTarget(null);
                }}
              >
                Tribus
              </button>
              <Link href="/" className="battle__quit battle__quit--desktop">
                Quitter
              </Link>
            </div>
          </div>
          <div className="battle__top-actions">
            <button
              type="button"
              className="battle__tribes-btn battle__tribes-btn--mobile"
              disabled={isOver || isRewardPick}
              onClick={() => {
                if (isOver || isRewardPick) return;
                setShowTribeChart((v) => !v);
                if (showTribeChart) setInspectTarget(null);
              }}
            >
              Tribus
            </button>
            <Link href="/" className="battle__quit battle__quit--mobile">
              Quitter
            </Link>
          </div>
        </div>

        <div className="battle__enemies" aria-label="Ennemis">
          {enemies.map((c) => {
            const inTargetMode = Boolean(specialTarget && !c.ko);
            const focused = attackFocusId === c.instanceId;
            const mult =
              inTargetMode && targetingActor
                ? getTypeMultiplier(targetingActor.tribe, c.tribe)
                : focused && current?.side === "ally"
                  ? getTypeMultiplier(current.tribe, c.tribe)
                  : inspectTarget === c.instanceId && inspectTribe
                    ? fieldAllies
                        .filter((a) => !a.ko)
                        .reduce((best, a) => Math.max(best, getTypeMultiplier(a.tribe, c.tribe)), 0)
                    : undefined;

            return (
              <EnemyFieldSprite
                key={c.instanceId}
                c={c}
                inspected={!inTargetMode && inspectTarget === c.instanceId}
                targetable={inTargetMode}
                focused={focused}
                captureSelected={captureTarget === c.instanceId}
                capturePhase={captureSeq?.targetId === c.instanceId ? captureSeq.phase : null}
                matchupMult={mult}
                onClick={
                  !c.ko && !captureSeq && !isOver && !isRewardPick
                    ? () => handleEnemyClick(c.instanceId)
                    : undefined
                }
                onContextMenu={
                  !c.ko && !captureSeq && !isOver && !isRewardPick
                    ? () => handleEnemyFocus(c.instanceId)
                    : undefined
                }
                floater={floaters.find((f) => f.targetId === c.instanceId)}
                hitFlash={hitFlashes[c.instanceId]}
              />
            );
          })}
        </div>

        {captureSeq ? (
          <CaptureSequence
            targetName={captureSeq.targetName}
            chancePct={captureSeq.chancePct}
            phase={captureSeq.phase}
          />
        ) : null}

        <div className="battle__allies" aria-label="Équipe">
          {fieldAllies.map((c) => (
            <AllyFieldSprite
              key={c.instanceId}
              c={c}
              acting={current?.instanceId === c.instanceId}
              hitFlash={hitFlashes[c.instanceId]}
              inspected={inspectAlly === c.instanceId}
              onClick={
                !c.ko && !captureSeq && !isOver && !isRewardPick
                  ? () => handleAllyInspect(c.instanceId)
                  : undefined
              }
            />
          ))}
        </div>

        {weakEnemy && !isOver && !captureTarget && !captureSeq ? (
          <button
            type="button"
            className="battle__ball"
            onClick={() => {
              setCaptureTarget(weakEnemy.instanceId);
              setInspectTarget(weakEnemy.instanceId);
            }}
          >
            Phantoball
            {runBalls.standard > 0 ? ` (${runBalls.standard})` : totalTribalBalls(runBalls) > 0 ? " 🎯" : ""}
          </button>
        ) : null}
      </div>

      <footer className="battle__hud" aria-label="Contrôles">
        <p className="battle__hud-tip">
          {specialTarget ? (
            "Clique un ennemi pour l'amultime"
          ) : (
            <>
              <span className="battle__tip battle__tip--desktop">
                Clic droit = cibler · gauche = tribus · jauge pleine = amultime
              </span>
              <span className="battle__tip battle__tip--mobile">
                Toucher = tribus · fiche → 🎯 Cibler · jauge pleine = amultime
              </span>
            </>
          )}
        </p>
        <div className="battle__slots battle__slots--hud" aria-label="Jauges d'âmes">
          {fieldAllies.map((c) => (
            <SoulSlot
              key={c.instanceId}
              c={c}
              ready={c.souls >= 1 && !c.ko}
              selected={specialActor === c.instanceId}
              matchupMult={inspectTribe ? getTypeMultiplier(c.tribe, inspectTribe) : undefined}
              onSelect={() => {
                if (c.ko || isOver || isRewardPick) return;
                if (c.souls >= 1) {
                  setSpecialActor((id) => (id === c.instanceId ? null : c.instanceId));
                  setCaptureTarget(null);
                  setInspectAlly(null);
                  return;
                }
                handleAllyInspect(c.instanceId);
              }}
            />
          ))}
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
              {fieldAllies.map((c) => (
                <SoulSlot
                  key={`deck-${c.instanceId}`}
                  c={c}
                  ready={c.souls >= 1 && !c.ko}
                  selected={specialActor === c.instanceId}
                  matchupMult={inspectTribe ? getTypeMultiplier(c.tribe, inspectTribe) : undefined}
                  onSelect={() => {
                    if (c.ko || isOver || isRewardPick) return;
                    if (c.souls >= 1) {
                      setSpecialActor((id) => (id === c.instanceId ? null : c.instanceId));
                      setCaptureTarget(null);
                      setInspectAlly(null);
                      return;
                    }
                    handleAllyInspect(c.instanceId);
                  }}
                />
              ))}
            </div>
          )}
        </div>
        <BattleWheel
          slots={wheelSlots}
          currentId={current?.side === "ally" ? current.instanceId : null}
          canRotate={!isOver && !paused}
          onRotate={handleRotate}
          placementMode={Boolean(pendingRecruit && !captureSeq)}
          pendingRecruit={pendingRecruit}
          onPickSlot={handlePlacement}
          relicIds={runRelics}
        />
        {showDevTools && engine ? <RunDevPanel engine={engine} onAction={bump} /> : null}
      </div>

      {isRewardPick ? (
        <WaveRewardPicker
          wave={state.wave}
          runGold={runGold}
          choices={rewardChoices}
          shopOffers={shopOffers}
          freeRewardPicked={freeRewardPicked}
          shopRerollCount={shopRerollCount}
          relicIds={runRelics}
          onPickFree={handleSelectReward}
          onBuy={handleBuyShop}
          onReroll={handleRerollShop}
          onContinue={handleContinueAfterReward}
        />
      ) : null}

      {showAllyFiche && inspectedAlly ? (
        <AllyInspect
          ally={inspectedAlly}
          onClose={() => setInspectAlly(null)}
          className="foe-inspect--on-desktop"
        />
      ) : null}

      {inspectedFoe && !inspectedFoe.ko && !showTribeChart && !isRewardPick && !specialTarget && !specialActor && !isOver ? (
        <FoeInspect
          foe={inspectedFoe}
          fieldAllies={fieldAllies}
          onClose={() => setInspectTarget(null)}
          onOpenChart={() => setShowTribeChart(true)}
          onFocusTarget={
            !captureSeq
              ? () => handleEnemyFocus(inspectedFoe.instanceId)
              : undefined
          }
          focused={attackFocusId === inspectedFoe.instanceId}
          onCapture={
            inspectedFoe.hp / inspectedFoe.maxHp <= 0.4
              ? () => setCaptureTarget(inspectedFoe.instanceId)
              : undefined
          }
        />
      ) : null}

      {showTribeChart && !isOver ? (
        <div className="battle__overlay battle__overlay--panel" role="dialog" aria-label="Table des tribus">
          <TribeChart
            focusDefender={inspectTribe}
            onClose={() => setShowTribeChart(false)}
          />
        </div>
      ) : null}

      {specialActor && actor && !isOver ? (
        <div className="battle__overlay" role="dialog" aria-label="Choisir une amultime">
          <div className="battle__spe-menu">
            <p className="battle__spe-title">{actor.name} — Amultime</p>
            <button type="button" className="battle__spe-btn" onClick={() => handlePickSpecial(1)}>
              <span className="battle__spe-btn-top">
                <span className="battle__spe-btn-name">{actor.skills.special1.name}</span>
                <span className="battle__spe-btn-meta">{targetingLabel(actor.skills.special1.targeting)}</span>
              </span>
              <span className="battle__spe-btn-desc">{describeSkill(actor.skills.special1)}</span>
            </button>
            <button type="button" className="battle__spe-btn" onClick={() => handlePickSpecial(2)}>
              <span className="battle__spe-btn-top">
                <span className="battle__spe-btn-name">{actor.skills.special2.name}</span>
                <span className="battle__spe-btn-meta">{targetingLabel(actor.skills.special2.targeting)}</span>
              </span>
              <span className="battle__spe-btn-desc">{describeSkill(actor.skills.special2)}</span>
            </button>
            <button type="button" className="battle__spe-cancel" onClick={() => setSpecialActor(null)}>
              Annuler
            </button>
          </div>
        </div>
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
                const matches = captureConfirm ? tribalBallMatches(id, captureConfirm.tribe) : false;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`battle__ball-opt ${selectedBall === id ? "battle__ball-opt--on" : ""} ${matches ? "battle__ball-opt--match" : ""}`}
                    onClick={() => setSelectedBall(id)}
                  >
                    {info.emoji} {info.name} ×{count}
                    {captureConfirm
                      ? matches
                        ? ` · ×${info.matchMult} tribu`
                        : ` · ×${info.mismatchMult} hors tribu`
                      : ""}
                  </button>
                );
              })}
            </div>
            <p className="battle__capture-note">
              Balls tribales : bonus si la tribu cible correspond · malus sinon · max 85 %
            </p>
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

      {isOver && state ? (
        <RunEndRecap
          outcome={isVictory ? "won" : "lost"}
          wave={state.wave}
          runGold={runGold}
          relicIds={runRelics}
          metaReward={metaReward}
          metaPending={metaPending}
          metaGrantError={metaGrantError}
          onRestart={restart}
        />
      ) : null}
    </div>
  );
}
