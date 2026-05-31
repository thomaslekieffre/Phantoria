"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  createRunBattle,
  computeCaptureChance,
  RUN_STARTER_WHEEL_INDEX,
  TRIBE_INFO,
  getTypeMultiplier,
  RUN_MAX_WAVES,
  getRunWaveKind,
  getRunWaveKindLabel,
  type CombatEngine,
  type CombatEvent,
  type Combatant,
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
import { CORE_TO_HUB } from "@/components/run/wheel-map";
import { CombatSpirit, combatSpiritHue } from "@/components/run/combat-spirit";
import { FoeInspect } from "@/components/run/foe-inspect";
import { TribeChart } from "@/components/run/tribe-chart";
import { WaveRewardPicker } from "@/components/run/wave-reward-picker";

const CORE_TO_HUB_MAP = CORE_TO_HUB;

type Floater = { id: number; targetId: string; amount: number };

function hubIdOf(c: Combatant): SpiritId | null {
  const id = CORE_TO_HUB_MAP[c.templateKey];
  return id && isSpiritId(id) ? id : null;
}

function hpTone(ratio: number) {
  if (ratio >= 0.6) return "ok";
  if (ratio >= 0.3) return "warn";
  return "low";
}

function AllyFieldSprite({ c, acting }: { c: Combatant; acting: boolean }) {
  const hue = combatSpiritHue(c.templateKey);
  return (
    <div className={`battle-ally ${acting ? "battle-ally--act" : ""} ${c.ko ? "battle-ally--ko" : ""}`}>
      <div
        className="battle-ally__body"
        style={{ background: `color-mix(in srgb, ${hue} 78%, #1a1028 22%)` }}
      >
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="battle-ally__sprite" />
      </div>
    </div>
  );
}

function EnemyFieldSprite({
  c,
  inspected,
  captureSelected,
  capturePhase,
  matchupMult,
  onInspect,
  floater,
}: {
  c: Combatant;
  inspected: boolean;
  captureSelected: boolean;
  capturePhase?: CapturePhase | null;
  matchupMult?: number;
  onInspect?: () => void;
  floater?: Floater;
}) {
  const ratio = c.maxHp > 0 ? c.hp / c.maxHp : 0;
  const capClass = capturePhase ? `battle-foe--cap-${capturePhase}` : "";
  const tribeInfo = TRIBE_INFO[c.tribe];
  const hue = combatSpiritHue(c.templateKey);

  return (
    <button
      type="button"
      className={`battle-foe ${inspected ? "battle-foe--inspect" : ""} ${captureSelected ? "battle-foe--sel" : ""} ${c.ko ? "battle-foe--ko" : ""} ${capClass}`}
      onClick={onInspect}
      disabled={!onInspect || c.ko || Boolean(capturePhase)}
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
        <CombatSpirit templateKey={c.templateKey} name={c.name} className="battle-foe__sprite" />
      </div>
      <span className="battle-foe__tribe">
        {tribeInfo.emoji} {tribeInfo.label}
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
  return (
    <button
      type="button"
      className={`soul-slot ${ready ? "soul-slot--ready" : ""} ${selected ? "soul-slot--sel" : ""} ${c.ko ? "soul-slot--ko" : ""} ${matchupMult !== undefined && matchupMult >= 2 ? "soul-slot--strong" : ""} ${matchupMult !== undefined && matchupMult <= 0.5 ? "soul-slot--weak" : ""}`}
      onClick={onSelect}
      disabled={c.ko}
      aria-label={`${c.name}, ${tribeInfo.label}, ${c.hp} sur ${c.maxHp} PV, jauge d'âmes ${soulPct} pourcent`}
    >
      <span className="soul-slot__name">{c.name}</span>
      <span className="soul-slot__tribe">
        {tribeInfo.emoji} {tribeInfo.label}
        {matchupMult !== undefined && matchupMult >= 2 ? " · ×2" : matchupMult !== undefined && matchupMult <= 0.5 ? (matchupMult <= 0 ? " · ×0" : " · ×½") : ""}
      </span>
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
        {c.hp}/{c.maxHp} PV
      </span>
      <div className="soul-slot__meter" role="progressbar" aria-valuenow={soulPct} aria-valuemin={0} aria-valuemax={100}>
        <span className="soul-slot__fill" style={{ width: `${soulPct}%` }} />
        {ready ? <span className="soul-slot__flame" aria-hidden /> : null}
      </div>
      <span className="soul-slot__hint">
        {c.ko ? "KO" : ready ? "Amultime !" : "Âmes"}
      </span>
    </button>
  );
}

export function RunScreen() {
  const [engine, setEngine] = useState<CombatEngine | null>(null);
  const [specialActor, setSpecialActor] = useState<string | null>(null);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [inspectTarget, setInspectTarget] = useState<string | null>(null);
  const [showTribeChart, setShowTribeChart] = useState(false);
  const [captureSeq, setCaptureSeq] = useState<CaptureSeqState | null>(null);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const lastEventId = useRef(0);
  const engineRef = useRef<CombatEngine | null>(null);
  const pausedRef = useRef(false);
  const isOverRef = useRef(false);

  engineRef.current = engine;

  const beginRun = (starterId: SpiritId) => {
    setEngine(
      createRunBattle({
        allySetup: [{ key: starterCoreKey(starterId), wheelIndex: RUN_STARTER_WHEEL_INDEX }],
      }),
    );
    setSpecialActor(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
    setRenderTick((n) => n + 1);
  };

  const state = engine?.getState();
  const current = engine?.getCurrentActor() ?? null;
  const fieldAllies = state?.combatants.filter((c) => c.side === "ally" && c.active) ?? [];
  const wheelSlots = engine?.getWheelSlots() ?? [];
  const enemies = state?.combatants.filter((c) => c.side === "enemy" && c.active) ?? [];
  const livingEnemies = enemies.filter((c) => !c.ko);
  const pendingRecruit = state?.pendingRecruit ?? null;
  const paused = Boolean(specialActor || captureTarget || pendingRecruit || captureSeq || state?.phase === "reward_pick");
  const isOver = state?.phase === "lost" || state?.phase === "won";
  const isVictory = state?.phase === "won";
  const isDefeat = state?.phase === "lost";
  const waveKind = state ? getRunWaveKind(state.wave) : "normal";
  const waveKindLabel = getRunWaveKindLabel(waveKind);
  const isBossWave = waveKind !== "normal";
  const isRewardPick = state?.phase === "reward_pick";
  const rewardChoices = state?.rewardChoices ?? null;
  const runRelics = state?.runRelics ?? [];
  const captureBonus = state?.runModifiers.captureBonus ?? 0;

  const inspectedFoe = inspectTarget ? engine?.getCombatant(inspectTarget) ?? null : null;
  const inspectTribe = inspectedFoe && !inspectedFoe.ko ? inspectedFoe.tribe : null;

  pausedRef.current = paused;
  isOverRef.current = isOver;

  const bump = () => setRenderTick((n) => n + 1);

  const weakEnemy = livingEnemies.find((e) => e.hp / e.maxHp <= 0.4);

  useEffect(() => {
    if (!engineRef.current) return;
    const events = engineRef.current.getState().events;
    const recent = events.filter((e) => e.id > lastEventId.current);
    lastEventId.current = events.at(-1)?.id ?? lastEventId.current;

    const hits = recent.filter(
      (e): e is CombatEvent & { amount: number; targetId: string } =>
        (e.kind === "attack" || e.kind === "special") &&
        typeof e.amount === "number" &&
        Boolean(e.targetId),
    );

    if (hits.length === 0) return;

    const next = hits.map((e) => ({ id: e.id, targetId: e.targetId!, amount: e.amount }));
    setFloaters((prev) => [...prev, ...next].slice(-6));

    const t = window.setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => !next.some((n) => n.id === f.id)));
    }, 900);
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
    if (!engine || isOver || paused) return;

    let alive = true;
    let timeout = 0;

    const schedule = () => {
      if (!alive || isOverRef.current || pausedRef.current) return;

      const eng = engineRef.current;
      if (!eng || eng.getState().phase !== "fighting") return;

      const actor = eng.getCurrentActor();
      const delay = !actor ? 50 : actor.side === "ally" ? 850 : 600;

      timeout = window.setTimeout(() => {
        if (!alive || isOverRef.current || pausedRef.current) return;
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
  }, [engine, isOver, paused]);

  const handleSpecial = (slot: 1 | 2) => {
    if (!engine || !specialActor) return;
    const actor = engine.getCombatant(specialActor);
    const target =
      captureTarget ??
      livingEnemies[0]?.instanceId ??
      undefined;
    if (actor?.skills[slot === 1 ? "special1" : "special2"].targeting === "single" && !target) return;
    engine.playerSpecial(specialActor, slot, target);
    setSpecialActor(null);
    bump();
  };

  const handleCapture = () => {
    if (!engine || !captureTarget) return;
    const target = engine.getCombatant(captureTarget);
    if (!target || target.ko) return;

    const hpRatio = target.hp / target.maxHp;
    const chancePct = Math.round(
      computeCaptureChance(target.rarity, hpRatio, "standard", engine.getState().runModifiers.captureBonus) * 100,
    );
    const targetId = captureTarget;
    const targetName = target.name;

    const success = engine.tryCapture(targetId);

    setCaptureTarget(null);
    setInspectTarget(null);
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
    if (!engine) return;
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
    setSpecialActor(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
    bump();
  };

  const restart = () => {
    setEngine(null);
    setSpecialActor(null);
    setCaptureTarget(null);
    setInspectTarget(null);
    setShowTribeChart(false);
    setFloaters([]);
    lastEventId.current = 0;
  };

  if (!engine || !state) {
    return <RunStarterPicker onPick={beginRun} />;
  }

  const actor = specialActor ? engine.getCombatant(specialActor) : null;
  const captureConfirm = captureTarget ? engine.getCombatant(captureTarget) : null;
  const captureConfirmChance = captureConfirm
    ? Math.round(
        computeCaptureChance(
          captureConfirm.rarity,
          captureConfirm.hp / captureConfirm.maxHp,
          "standard",
          captureBonus,
        ) * 100,
      )
    : 0;

  return (
    <div className="battle">
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

      <div className="battle__main">
      <div className="battle__field">
        <div className="battle__sky" />
        <div className="battle__ground" />

        <div className="battle__top">
          <div className="battle__top-left">
            <span className="battle__wave">
              {isBossWave ? (
                <span className={`battle__wave-tag battle__wave-tag--${waveKind}`}>{waveKindLabel}</span>
              ) : null}
              {state.wave}/{RUN_MAX_WAVES}
            </span>
          </div>
          <div className="battle__top-center">
            {current && !isOver && !isRewardPick ? (
              <span className="battle__turn">{current.name} agit…</span>
            ) : (
              <span className="battle__turn battle__turn--idle">Combat</span>
            )}
          </div>
          <div className="battle__top-right">
            <button
              type="button"
              className="battle__tribes-btn"
              onClick={() => {
                setShowTribeChart((v) => !v);
                if (showTribeChart) setInspectTarget(null);
              }}
            >
              Tribus
            </button>
            <Link href="/" className="battle__quit">
              Quitter
            </Link>
          </div>
        </div>

        <div className="battle__enemies" aria-label="Ennemis">
          {enemies.map((c) => (
            <EnemyFieldSprite
              key={c.instanceId}
              c={c}
              inspected={inspectTarget === c.instanceId}
              captureSelected={captureTarget === c.instanceId}
              capturePhase={captureSeq?.targetId === c.instanceId ? captureSeq.phase : null}
              matchupMult={
                inspectTarget === c.instanceId && inspectTribe
                  ? fieldAllies
                      .filter((a) => !a.ko)
                      .reduce((best, a) => Math.max(best, getTypeMultiplier(a.tribe, c.tribe)), 0)
                  : undefined
              }
              onInspect={
                !c.ko && !captureSeq
                  ? () => {
                      setInspectTarget((id) => (id === c.instanceId ? null : c.instanceId));
                      setShowTribeChart(false);
                    }
                  : undefined
              }
              floater={floaters.find((f) => f.targetId === c.instanceId)}
            />
          ))}
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
            <AllyFieldSprite key={c.instanceId} c={c} acting={current?.instanceId === c.instanceId} />
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
          </button>
        ) : null}

        {isDefeat ? (
          <div className="battle__end battle__end--lose">
            <p>Défaite…</p>
            <span className="battle__end-meta">Vague {state.wave}/{RUN_MAX_WAVES}</span>
            <button type="button" className="battle__end-btn" onClick={restart}>
              Recommencer
            </button>
          </div>
        ) : null}

        {isVictory ? (
          <div className="battle__end battle__end--win">
            <p>Victoire !</p>
            <span className="battle__end-meta">
              Run terminé — {RUN_MAX_WAVES} vagues · {runRelics.length} relique{runRelics.length > 1 ? "s" : ""}
            </span>
            <button type="button" className="battle__end-btn" onClick={restart}>
              Nouveau run
            </button>
          </div>
        ) : null}
      </div>

      <footer className="battle__hud" aria-label="Jauges d'âmes">
        <p className="battle__hud-tip">
          Clique un esprit adverse pour sa tribu · slots lumineux = amultime
        </p>
        <div className="battle__slots">
          {fieldAllies.map((c) => (
            <SoulSlot
              key={c.instanceId}
              c={c}
              ready={c.souls >= 1 && !c.ko}
              selected={specialActor === c.instanceId}
              matchupMult={inspectTribe ? getTypeMultiplier(c.tribe, inspectTribe) : undefined}
              onSelect={() => {
                if (c.ko) return;
                if (c.souls >= 1) {
                  setSpecialActor((id) => (id === c.instanceId ? null : c.instanceId));
                  setCaptureTarget(null);
                }
              }}
            />
          ))}
        </div>
      </footer>
      </div>

      {isRewardPick && rewardChoices ? (
        <WaveRewardPicker
          wave={state.wave}
          choices={rewardChoices}
          relicIds={runRelics}
          onPick={handleSelectReward}
        />
      ) : null}

      {inspectedFoe && !inspectedFoe.ko && !showTribeChart && !isRewardPick ? (
        <FoeInspect
          foe={inspectedFoe}
          fieldAllies={fieldAllies}
          onClose={() => setInspectTarget(null)}
          onOpenChart={() => setShowTribeChart(true)}
          onCapture={
            inspectedFoe.hp / inspectedFoe.maxHp <= 0.4
              ? () => setCaptureTarget(inspectedFoe.instanceId)
              : undefined
          }
        />
      ) : null}

      {showTribeChart ? (
        <div className="battle__overlay battle__overlay--panel" role="dialog" aria-label="Table des tribus">
          <TribeChart
            focusDefender={inspectTribe}
            onClose={() => setShowTribeChart(false)}
          />
        </div>
      ) : null}

      {specialActor && actor ? (
        <div className="battle__overlay" role="dialog" aria-label="Choisir une amultime">
          <div className="battle__spe-menu">
            <p className="battle__spe-title">{actor.name} — Amultime</p>
            <button type="button" className="battle__spe-btn" onClick={() => handleSpecial(1)}>
              {actor.skills.special1.name}
            </button>
            <button type="button" className="battle__spe-btn" onClick={() => handleSpecial(2)}>
              {actor.skills.special2.name}
            </button>
            <button type="button" className="battle__spe-cancel" onClick={() => setSpecialActor(null)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {captureTarget && captureConfirm ? (
        <div className="battle__overlay battle__overlay--dim" role="dialog" aria-label="Capture">
          <div className="battle__spe-menu battle__spe-menu--capture">
            <p className="battle__spe-title">Capturer {captureConfirm.name} ?</p>
            <p className="battle__capture-chance">Chance : {captureConfirmChance} %</p>
            <p className="battle__capture-note">Jamais garanti — max 85 % · si ça rate, l&apos;ennemi reste en vie.</p>
            <button type="button" className="battle__spe-btn battle__spe-btn--ball" onClick={handleCapture}>
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
