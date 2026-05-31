import { getTemplate } from "./characters";
import { applyRunReward, rollRewardChoices, isPersistentRunRelic, rollShopOffers, getRunReward, waveClearGold, RUN_START_GOLD } from "./run-rewards";
import { getRunWaveSetup, RUN_MAX_WAVES, getRunWaveKind } from "./run-waves";
import {
  computeCaptureChance,
  computeDamage,
  rollCapture,
  soulGainFromDamage,
  statsAtLevel,
} from "./formulas";
import type {
  CharacterTemplate,
  Combatant,
  CombatEvent,
  CombatState,
  PendingRecruit,
  PhantoballType,
  Side,
  SkillTemplate,
  WheelRotation,
} from "./types";
import { MAX_WHEEL, isFieldWheelIndex } from "./types";

let idSeq = 0;
function uid(): string {
  idSeq += 1;
  return `c${idSeq}`;
}

let eventSeq = 0;

function livingOnField(combatants: Combatant[]): Combatant[] {
  return combatants.filter((c) => c.active && !c.ko);
}

function livingAllies(combatants: Combatant[]): Combatant[] {
  return combatants.filter((c) => c.side === "ally" && !c.ko);
}

function foesOf(actor: Combatant, combatants: Combatant[]): Combatant[] {
  return livingOnField(combatants).filter((c) => c.side !== actor.side);
}

function alliesOf(actor: Combatant, combatants: Combatant[]): Combatant[] {
  return livingOnField(combatants).filter((c) => c.side === actor.side);
}

function spawn(
  templateKey: string,
  side: Side,
  level: number,
  active: boolean,
  wheelIndex = -1,
  statMult = 1,
): Combatant {
  const t = getTemplate(templateKey);
  const stats = statsAtLevel(t.base, level);
  const scale = (n: number) => Math.max(1, Math.floor(n * statMult));
  return {
    instanceId: uid(),
    templateKey,
    name: t.name,
    tribe: t.tribe,
    rarity: t.rarity,
    side,
    level,
    maxHp: scale(stats.hp),
    hp: scale(stats.hp),
    atk: scale(stats.atk),
    def: scale(stats.def),
    vit: stats.vit,
    wheelIndex,
    active,
    ko: false,
    souls: 0,
    skills: t.skills,
  };
}

function spawnEnemiesFromSetup(setup: ReturnType<typeof getRunWaveSetup>): Combatant[] {
  return setup.enemyKeys.map((key, i) =>
    spawn(key, "enemy", setup.enemyLevel, true, -1, setup.enemyStatMults[i] ?? 1),
  );
}

function applyFieldStatus(c: Combatant) {
  c.active = isFieldWheelIndex(c.wheelIndex) && !c.ko;
}

function buildTurnQueue(combatants: Combatant[]): string[] {
  return livingOnField(combatants)
    .slice()
    .sort((a, b) => b.vit - a.vit || a.instanceId.localeCompare(b.instanceId))
    .map((c) => c.instanceId);
}

function pickTarget(
  skill: SkillTemplate,
  actor: Combatant,
  combatants: Combatant[],
  manualTargetId?: string,
): Combatant | null {
  const foes = foesOf(actor, combatants);
  if (foes.length === 0) return null;

  if (skill.targeting === "aoe") return foes[0] ?? null;

  if (skill.targeting === "single") {
    if (manualTargetId) {
      return foes.find((f) => f.instanceId === manualTargetId) ?? foes[0] ?? null;
    }
    return foes[0] ?? null;
  }

  const idx = Math.floor(Math.random() * foes.length);
  return foes[idx] ?? foes[0] ?? null;
}

export interface CreateBattleOptions {
  wave?: number;
  /** { key, wheelIndex } — défaut = run roguelite (1 perso) */
  allySetup?: { key: string; wheelIndex: number }[];
  enemyKeys?: string[];
  allyLevel?: number;
  enemyLevel?: number;
}

/** Setup démo / tests — 4 esprits */
export const DEV_ALLY_SETUP = [
  { key: "bram_vaillant", wheelIndex: 5 },
  { key: "nyx_mysterieux", wheelIndex: 0 },
  { key: "luma_mignon", wheelIndex: 1 },
  { key: "kiro_perfide", wheelIndex: 2 },
] as const;

/** Départ run roguelite — 1 esprit sur le terrain (slot 5) */
export const RUN_STARTER_KEY = "bram_vaillant";
export const RUN_STARTER_WHEEL_INDEX = 5;

export const RUN_ALLY_SETUP = [{ key: RUN_STARTER_KEY, wheelIndex: RUN_STARTER_WHEEL_INDEX }] as const;

export function createRunBattle(opts: Omit<CreateBattleOptions, "allySetup"> & {
  allySetup?: { key: string; wheelIndex: number }[];
} = {}): CombatEngine {
  const allySetup = opts.allySetup ?? [...RUN_ALLY_SETUP];
  const wave = opts.wave ?? 1;
  const waveSetup = getRunWaveSetup(wave, allySetup.length);

  return createBattle({
    ...opts,
    allySetup,
    wave,
    enemyKeys: opts.enemyKeys ?? waveSetup.enemyKeys,
    enemyLevel: opts.enemyLevel ?? waveSetup.enemyLevel,
  });
}

export function createBattle(opts: CreateBattleOptions = {}): CombatEngine {
  const allySetup = opts.allySetup ?? [...RUN_ALLY_SETUP];
  const wave = opts.wave ?? 1;
  const defaultWave = getRunWaveSetup(wave, allySetup.length);
  const enemyKeys = opts.enemyKeys ?? defaultWave.enemyKeys;
  const allyLevel = opts.allyLevel ?? 5;
  const enemyLevel = opts.enemyLevel ?? defaultWave.enemyLevel;
  const useDefaultEnemies = !opts.enemyKeys;

  const combatants: Combatant[] = [
    ...allySetup.map((a) => {
      const c = spawn(a.key, "ally", allyLevel, false, a.wheelIndex);
      applyFieldStatus(c);
      return c;
    }),
    ...(useDefaultEnemies
      ? spawnEnemiesFromSetup(defaultWave)
      : enemyKeys.map((k) => spawn(k, "enemy", enemyLevel, true))),
  ];

  const turnQueue = buildTurnQueue(combatants);

  const state: CombatState = {
    wave: opts.wave ?? 1,
    round: 1,
    combatants,
    turnQueue,
    queueIndex: 0,
    phase: "fighting",
    events: [],
    captureTargetId: null,
    pendingRecruit: null,
    runRelics: [],
    runModifiers: { soulGainMult: 1, captureBonus: 0 },
    rewardChoices: null,
    freeRewardPicked: false,
    shopOffers: null,
    runGold: RUN_START_GOLD,
    attackFocusId: null,
  };

  const engine = new CombatEngine(state);
  return engine;
}

export class CombatEngine {
  private state: CombatState;

  constructor(state: CombatState, logFirstTurn = true) {
    this.state = state;
    if (logFirstTurn) {
      const first = this.getCurrentActor();
      if (first) {
        this.pushEvent("turn_start", `${first.name}`, first.instanceId);
      }
    }
  }

  getState(): Readonly<CombatState> {
    return this.state;
  }

  getCurrentActor(): Combatant | null {
    const id = this.state.turnQueue[this.state.queueIndex];
    if (!id) return null;
    const c = this.state.combatants.find((x) => x.instanceId === id);
    return c && !c.ko && c.active ? c : null;
  }

  getCombatant(id: string): Combatant | undefined {
    return this.state.combatants.find((c) => c.instanceId === id);
  }

  getRecentEvents(limit = 12): CombatEvent[] {
    return this.state.events.slice(-limit);
  }

  /** Roue ×6 — null = emplacement libre */
  getWheelSlots(): (Combatant | null)[] {
    const slots: (Combatant | null)[] = Array(6).fill(null);
    for (const c of this.state.combatants) {
      if (c.side === "ally" && c.wheelIndex >= 0 && c.wheelIndex < 6) {
        slots[c.wheelIndex] = c;
      }
    }
    return slots;
  }

  /** Fait tourner la roue — arc haut (5,0,1) = terrain */
  rotateWheel(direction: WheelRotation): boolean {
    if (this.state.phase !== "fighting") return false;

    this.applyWheelRotation(direction);
    this.resyncTurnQueue();
    this.pushEvent("wheel_rotate", direction === "cw" ? "Roue ↻" : "Roue ↺");
    return true;
  }

  private applyWheelRotation(direction: WheelRotation): void {
    const delta = direction === "cw" ? 1 : -1;
    const allies = this.state.combatants.filter((c) => c.side === "ally" && c.wheelIndex >= 0);

    for (const c of allies) {
      const wasActive = c.active;
      c.wheelIndex = (c.wheelIndex + delta + 6) % 6;
      applyFieldStatus(c);
      if (c.active !== wasActive) c.souls = 0;
    }
  }

  /** Terrain vide mais vivants en réserve → meilleure rotation auto */
  private tryAutoFillField(): boolean {
    if (this.state.phase !== "fighting") return false;

    const onField = livingOnField(this.state.combatants).filter((c) => c.side === "ally");
    if (onField.length > 0) return false;
    if (livingAllies(this.state.combatants).length === 0) return false;

    const allies = this.state.combatants.filter((c) => c.side === "ally" && c.wheelIndex >= 0);
    let bestDelta = 0;
    let bestCount = 0;

    for (let delta = 1; delta < 6; delta += 1) {
      const count = allies.filter(
        (c) => !c.ko && isFieldWheelIndex((c.wheelIndex + delta) % 6),
      ).length;
      if (count > bestCount) {
        bestCount = count;
        bestDelta = delta;
      }
    }

    if (bestCount === 0) return false;

    for (let i = 0; i < bestDelta; i += 1) {
      this.applyWheelRotation("cw");
    }

    this.resyncTurnQueue();
    this.pushEvent("wheel_rotate", "Roue auto — renforts sur le terrain");
    return true;
  }

  private resyncTurnQueue() {
    const prevId = this.state.turnQueue[this.state.queueIndex];
    this.state.turnQueue = buildTurnQueue(this.state.combatants);
    const idx = prevId ? this.state.turnQueue.indexOf(prevId) : -1;
    this.state.queueIndex = idx >= 0 ? idx : 0;
  }

  /** Tour auto — attaque de base ; alliés = focus joueur ou premier ennemi */
  tickTurn(): boolean {
    if (this.state.phase !== "fighting") return false;
    this.tryAutoFillField();

    const actor = this.getCurrentActor();
    if (!actor) {
      this.advanceTurn();
      return this.state.phase === "fighting";
    }

    const foes = foesOf(actor, this.state.combatants);
    if (foes.length === 0) return this.checkEnd();

    if (actor.side === "ally") {
      const focusId = this.state.attackFocusId;
      const focusValid = focusId && foes.some((f) => f.instanceId === focusId);
      const targetId = focusValid ? focusId! : foes[0]!.instanceId;
      return this.resolveAttack(actor, actor.skills.basic, targetId);
    }

    const target = foes.reduce((low, f) => (f.hp < low.hp ? f : low));
    return this.resolveAttack(actor, actor.skills.basic, target.instanceId);
  }

  /** Marque un ennemi pour les attaques de base (clic droit) — re-clic = désélection */
  setAttackFocus(targetId: string): boolean {
    if (this.state.phase !== "fighting") return false;
    const target = this.getCombatant(targetId);
    if (!target || target.side !== "enemy" || target.ko || !target.active) return false;
    this.state.attackFocusId = this.state.attackFocusId === targetId ? null : targetId;
    return true;
  }

  /** Spéciale hors file VIT — si jauge pleine */
  playerSpecial(actorId: string, slot: 1 | 2, targetId?: string): boolean {
    const actor = this.getCombatant(actorId);
    if (!actor || actor.side !== "ally" || actor.ko || !actor.active) return false;
    if (actor.souls < 1) return false;
    if (this.state.phase === "won" || this.state.phase === "lost") return false;

    const skill = slot === 1 ? actor.skills.special1 : actor.skills.special2;
    actor.souls = 0;
    this.pushEvent("special", `${actor.name} — ${skill.name}`, actor.instanceId);
    return this.resolveAttack(actor, skill, targetId, true);
  }

  /** @deprecated Utiliser tickTurn() */
  tickEnemyTurn(): boolean {
    return this.tickTurn();
  }

  tryCapture(
    targetId: string,
    ball: PhantoballType = "standard",
    rng: () => number = Math.random,
  ): boolean {
    if (this.state.phase === "won" || this.state.phase === "lost") return false;
    if (this.state.pendingRecruit) return false;

    const target = this.getCombatant(targetId);
    if (!target || target.side !== "enemy" || target.ko) return false;

    const hpRatio = target.hp / target.maxHp;
    if (hpRatio > 0.4) return false;

    const chance = computeCaptureChance(
      target.rarity,
      hpRatio,
      ball,
      this.state.runModifiers.captureBonus,
    );
    this.pushEvent(
      "capture_attempt",
      `Phantoball sur ${target.name} (${Math.round(chance * 100)} %)`,
      undefined,
      targetId,
    );

    if (rollCapture(chance, rng)) {
      const snapshot: PendingRecruit = {
        templateKey: target.templateKey,
        name: target.name,
        tribe: target.tribe,
        rarity: target.rarity,
        level: target.level,
        maxHp: target.maxHp,
        hp: target.hp,
        atk: target.atk,
        def: target.def,
        vit: target.vit,
      };

      target.ko = true;
      target.hp = 0;
      this.state.captureTargetId = target.templateKey;
      this.state.pendingRecruit = snapshot;

      this.pushEvent(
        "capture_pending",
        `${target.name} capturé — choisis un slot sur la roue`,
        undefined,
        targetId,
      );

      return true;
    }

    this.pushEvent("capture_fail", `${target.name} s'échappe…`, undefined, targetId);
    return false;
  }

  /** Place la recrue capturée sur un slot — remplace l'occupant s'il y en a un */
  completeCapturePlacement(wheelIndex: number): boolean {
    const pending = this.state.pendingRecruit;
    if (!pending || this.state.phase === "lost") return false;
    if (wheelIndex < 0 || wheelIndex >= MAX_WHEEL) return false;

    const occupant = this.state.combatants.find(
      (c) => c.side === "ally" && c.wheelIndex === wheelIndex,
    );

    if (occupant) {
      this.state.combatants = this.state.combatants.filter(
        (c) => c.instanceId !== occupant.instanceId,
      );
    }

    this.addRecruitToWheel(pending, wheelIndex);
    this.state.pendingRecruit = null;

    this.pushEvent(
      "capture_success",
      occupant
        ? `${pending.name} prend la place de ${occupant.name}`
        : `${pending.name} rejoint la roue`,
    );

    this.checkEnd();
    return true;
  }

  /** @deprecated Utiliser completeCapturePlacement(wheelIndex) */
  completeCaptureWithEject(ejectInstanceId: string): boolean {
    const eject = this.getCombatant(ejectInstanceId);
    if (!eject || eject.side !== "ally") return false;
    return this.completeCapturePlacement(eject.wheelIndex);
  }

  private addRecruitToWheel(pending: PendingRecruit, slot: number): Combatant {
    const recruit: Combatant = {
      instanceId: uid(),
      templateKey: pending.templateKey,
      name: pending.name,
      tribe: pending.tribe,
      rarity: pending.rarity,
      side: "ally",
      level: pending.level,
      maxHp: pending.maxHp,
      hp: pending.hp,
      atk: pending.atk,
      def: pending.def,
      vit: pending.vit,
      wheelIndex: slot,
      active: false,
      ko: false,
      souls: 0,
      skills: getTemplate(pending.templateKey).skills,
    };
    applyFieldStatus(recruit);
    this.state.combatants.push(recruit);
    this.resyncTurnQueue();
    this.tryAutoFillField();
    return recruit;
  }

  private resolveAttack(
    actor: Combatant,
    skill: SkillTemplate,
    manualTargetId?: string,
    isSpecial = false,
  ): boolean {
    const tribe = skill.tribe ?? actor.tribe;

    if (skill.targeting === "aoe") {
      const foes = foesOf(actor, this.state.combatants);
      if (foes.length === 0) return this.checkEnd();

      for (const foe of foes) {
        this.applyHit(actor, foe, skill, tribe, isSpecial);
      }
    } else {
      const target = pickTarget(skill, actor, this.state.combatants, manualTargetId);
      if (!target) return this.checkEnd();
      this.applyHit(actor, target, skill, tribe, isSpecial);
    }

    if (!isSpecial) {
      this.advanceTurn();
    } else {
      this.checkEnd();
    }
    return true;
  }

  private applyHit(
    actor: Combatant,
    target: Combatant,
    skill: SkillTemplate,
    tribe: CharacterTemplate["tribe"],
    isSpecial: boolean,
  ) {
    const dmg = computeDamage(actor.atk, target.def, skill.power, tribe, target.tribe);
    target.hp = Math.max(0, target.hp - dmg);

    const gainActor = soulGainFromDamage(dmg, actor.maxHp);
    const gainTarget = soulGainFromDamage(dmg, target.maxHp);
    if (actor.active && !actor.ko) {
      const before = actor.souls;
      const mult = this.state.runModifiers.soulGainMult;
      actor.souls = Math.min(1, actor.souls + gainActor * mult);
      if (before < 1 && actor.souls >= 1) {
        this.pushEvent("soul_ready", `${actor.name} — Amultime prête !`, actor.instanceId);
      }
    }
    if (target.active && !target.ko && target.side === "ally") {
      const before = target.souls;
      const mult = this.state.runModifiers.soulGainMult;
      target.souls = Math.min(1, target.souls + gainTarget * mult);
      if (before < 1 && target.souls >= 1) {
        this.pushEvent("soul_ready", `${target.name} — Amultime prête !`, target.instanceId);
      }
    }

    this.pushEvent(
      isSpecial ? "special" : "attack",
      `${actor.name} → ${target.name}`,
      actor.instanceId,
      target.instanceId,
      dmg,
    );

    if (target.hp <= 0 && !target.ko) {
      target.ko = true;
      applyFieldStatus(target);
      this.pushEvent("ko", `${target.name} est KO`, undefined, target.instanceId);
      if (target.side === "ally") {
        this.resyncTurnQueue();
        this.tryAutoFillField();
      }
    }
  }

  private advanceTurn() {
    if (this.checkEnd()) return;

    const maxSteps = Math.max(this.state.turnQueue.length, livingOnField(this.state.combatants).length) + 2;

    for (let step = 0; step < maxSteps; step += 1) {
      let nextIndex = this.state.queueIndex + 1;
      if (nextIndex >= this.state.turnQueue.length) {
        this.state.round += 1;
        this.tryAutoFillField();
        this.state.turnQueue = buildTurnQueue(this.state.combatants);
        nextIndex = 0;
      }
      this.state.queueIndex = nextIndex;

      if (this.checkEnd()) return;

      const next = this.getCurrentActor();
      if (next) {
        this.pushEvent("turn_start", `${next.name}`, next.instanceId);
        return;
      }
    }

    this.checkEnd();
  }

  /** Vague suivante — après choix récompense ou legacy */
  startNextWave(opts?: { enemyKeys?: string[]; enemyLevel?: number }): boolean {
    if (this.state.phase !== "reward_pick" && this.state.phase !== "won") return false;

    this.state.combatants = this.state.combatants.filter((c) => c.side === "ally");

    const wave = this.state.wave + 1;
    const allyCount = this.state.combatants.filter((c) => c.side === "ally").length;
    const waveSetup = getRunWaveSetup(wave, allyCount);
    const enemyKeys = opts?.enemyKeys ?? waveSetup.enemyKeys;
    const enemyLevel = opts?.enemyLevel ?? waveSetup.enemyLevel;

    if (opts?.enemyKeys) {
      for (const key of enemyKeys) {
        this.state.combatants.push(spawn(key, "enemy", enemyLevel, true));
      }
    } else {
      for (const enemy of spawnEnemiesFromSetup(waveSetup)) {
        this.state.combatants.push(enemy);
      }
    }

    this.state.wave = wave;
    this.state.round = 1;
    this.state.turnQueue = buildTurnQueue(this.state.combatants);
    this.state.queueIndex = 0;
    this.state.phase = "fighting";
    this.state.captureTargetId = null;
    this.state.pendingRecruit = null;
    this.state.rewardChoices = null;
    this.state.freeRewardPicked = false;
    this.state.shopOffers = null;
    this.state.attackFocusId = null;

    const waveLabel =
      waveSetup.kind === "normal" ? `Vague ${wave}` : `${waveSetup.label} — vague ${wave}`;
    this.pushEvent("wave_start", waveLabel);

    const first = this.getCurrentActor();
    if (first) {
      this.pushEvent("turn_start", `${first.name}`, first.instanceId);
    }

    return true;
  }

  /** Récompense gratuite entre vagues — reste sur l'écran boutique jusqu'à Continuer */
  selectReward(rewardId: string): boolean {
    if (this.state.phase !== "reward_pick") return false;
    if (this.state.freeRewardPicked) return false;

    const reward = this.state.rewardChoices?.find((r) => r.id === rewardId);
    if (!reward) return false;

    const msg = applyRunReward(this.state, reward);
    if (isPersistentRunRelic(reward)) {
      this.state.runRelics.push(rewardId);
    }

    this.pushEvent("wave_end", `${msg} (gratuit)`);
    this.state.freeRewardPicked = true;
    this.state.rewardChoices = null;
    return true;
  }

  /** Achat boutique entre vagues */
  buyShopOffer(rewardId: string): boolean {
    if (this.state.phase !== "reward_pick") return false;

    const offerIdx = this.state.shopOffers?.findIndex((o) => o.rewardId === rewardId) ?? -1;
    if (offerIdx < 0 || !this.state.shopOffers) return false;

    const offer = this.state.shopOffers[offerIdx]!;
    if (this.state.runGold < offer.price) return false;

    const reward = getRunReward(rewardId);
    if (!reward) return false;
    if (!reward.stackable && isPersistentRunRelic(reward) && this.state.runRelics.includes(rewardId)) {
      return false;
    }

    this.state.runGold -= offer.price;
    const msg = applyRunReward(this.state, reward);
    if (isPersistentRunRelic(reward)) {
      this.state.runRelics.push(rewardId);
    }

    if (!reward.stackable) {
      this.state.shopOffers = this.state.shopOffers.filter((_, i) => i !== offerIdx);
    }

    this.pushEvent("wave_end", `${msg} — ${offer.price} €`);
    return true;
  }

  /** Passe à la vague suivante après récompense gratuite (+ achats optionnels) */
  continueAfterReward(): boolean {
    if (this.state.phase !== "reward_pick") return false;
    if (!this.state.freeRewardPicked) return false;

    this.state.shopOffers = null;

    if (this.state.wave >= RUN_MAX_WAVES) {
      this.state.phase = "won";
      this.pushEvent("wave_end", `Victoire — run terminé à la vague ${RUN_MAX_WAVES} !`);
      return true;
    }

    return this.startNextWave();
  }

  private checkEnd(): boolean {
    const allies = livingAllies(this.state.combatants);
    const enemies = livingOnField(this.state.combatants).filter((c) => c.side === "enemy");

    if (allies.length === 0) {
      this.state.phase = "lost";
      this.pushEvent("wave_end", "Défaite — run terminé");
      return true;
    }
    if (enemies.length === 0) {
      if (this.state.pendingRecruit) return false;

      this.state.phase = "reward_pick";
      this.state.rewardChoices = rollRewardChoices(this.state.wave, this.state.runRelics);
      this.state.freeRewardPicked = false;
      this.state.shopOffers = rollShopOffers(this.state.wave, this.state.runRelics);
      const waveKind = getRunWaveKind(this.state.wave);
      this.state.runGold += waveClearGold(this.state.wave, waveKind);
      const waveSetup = getRunWaveSetup(this.state.wave, livingAllies(this.state.combatants).length);
      const cleared =
        waveSetup.kind === "normal"
          ? `Vague ${this.state.wave} cleared !`
          : `${waveSetup.label} vaincu — vague ${this.state.wave} !`;
      this.pushEvent("wave_end", cleared);
      return true;
    }
    return false;
  }

  private pushEvent(
    kind: CombatEvent["kind"],
    text: string,
    actorId?: string,
    targetId?: string,
    amount?: number,
  ) {
    eventSeq += 1;
    this.state.events.push({ id: eventSeq, kind, text, actorId, targetId, amount });
  }
}

export function getRecentEvents(state: CombatState, limit = 12): CombatEvent[] {
  return state.events.slice(-limit);
}
