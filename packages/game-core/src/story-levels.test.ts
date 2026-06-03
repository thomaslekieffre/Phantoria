import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRunBattle, createStoryBattle } from "./combat-engine";
import { computeStoryStars, getStoryLevel, getStoryLevelByCoords, isStoryZoneUnlocked, levelsForZone, computeStoryGoldReward } from "./story-levels";

describe("story mode", () => {
  it("zone 1 contient 15 niveaux", () => {
    const levels = levelsForZone(1);
    assert.equal(levels.length, 15);
    assert.equal(levels[0]?.id, "1-1");
    assert.equal(levels[14]?.id, "1-15");
  });

  it("getStoryLevelByCoords résout chaque index zone 1", () => {
    for (let i = 1; i <= 15; i++) {
      const level = getStoryLevelByCoords(1, i);
      assert.ok(level, `niveau 1-${i} manquant`);
      assert.equal(level.index, i);
    }
  });

  it("zone 2 contient 15 niveaux", () => {
    const levels = levelsForZone(2);
    assert.equal(levels.length, 15);
    assert.equal(levels[0]?.id, "2-1");
    assert.equal(levels[14]?.id, "2-15");
  });

  it("zone 2 verrouillée sans clear 1-15", () => {
    assert.equal(isStoryZoneUnlocked(2, { levels: {} }), false);
    assert.equal(
      isStoryZoneUnlocked(2, { levels: { "1-15": { cleared: true } } }),
      true,
    );
  });

  it("boss 2-5 démarre avec sigille enma", () => {
    const boss = getStoryLevelByCoords(2, 5);
    assert.ok(boss);
    const engine = createStoryBattle(boss, [
      { key: "bram_vaillant", wheelIndex: 5, level: 5, hpPct: 100 },
    ]);
    const enemies = engine.getState().combatants.filter((c) => c.side === "enemy");
    assert.equal(enemies[0]?.templateKey, "sigille_enma");
  });

  const level = getStoryLevel("1-1");
  if (!level) throw new Error("missing level 1-1");

  it("boss 1-5 démarre avec gardien", () => {
    const boss = getStoryLevelByCoords(1, 5);
    assert.ok(boss);
    const engine = createStoryBattle(boss, [
      { key: "bram_vaillant", wheelIndex: 5, level: 3, hpPct: 100 },
    ]);
    const enemies = engine.getState().combatants.filter((c) => c.side === "enemy");
    assert.equal(enemies.length, 1);
    assert.equal(enemies[0]?.templateKey, "boss_gardien");
  });

  it("niveau 1-9 a trois ennemis", () => {
    const l9 = getStoryLevelByCoords(1, 9);
    assert.ok(l9);
    const engine = createStoryBattle(l9!, [
      { key: "bram_vaillant", wheelIndex: 0, level: 5, hpPct: 100 },
      { key: "luma_mignon", wheelIndex: 1, level: 5, hpPct: 100 },
      { key: "nyx_mysterieux", wheelIndex: 5, level: 5, hpPct: 100 },
    ]);
    assert.equal(engine.getState().combatants.filter((c) => c.side === "enemy").length, 3);
  });

  it("createRunBattle — alliés niveau 1 sans XP collection", () => {
    const engine = createRunBattle();
    const allies = engine.getState().combatants.filter((c) => c.side === "ally");
    assert.ok(allies.length >= 1);
    assert.ok(allies.every((a) => a.level === 1 && a.xp === 0));
    assert.equal(engine.getState().battleMode, "run");
  });

  it("createStoryBattle — charge niveau, XP et PV collection", () => {
    const lvl = getStoryLevel("1-1");
    assert.ok(lvl);
    const engine = createStoryBattle(lvl, [
      { key: "bram_vaillant", wheelIndex: 5, level: 3, xp: 12, hpPct: 80 },
    ]);
    const bram = engine.getState().combatants.find((c) => c.side === "ally")!;
    assert.equal(bram.level, 3);
    assert.equal(bram.xp, 12);
    assert.ok(bram.hp <= Math.floor(bram.maxHp * 0.81));
    assert.equal(engine.getState().battleMode, "story");
  });

  it("createStoryBattle démarre en fighting sans balls", () => {
    const engine = createStoryBattle(level, [
      { key: "bram_vaillant", wheelIndex: 5, level: 1, hpPct: 100 },
    ]);
    const state = engine.getState();
    assert.equal(state.battleMode, "story");
    assert.equal(state.storyLevelId, "1-1");
    assert.equal(state.runBalls.standard, 0);
    assert.ok(state.combatants.some((c) => c.side === "enemy"));
  });

  it("victoire histoire → won sans reward_pick", () => {
    const engine = createStoryBattle(level, [
      { key: "bram_vaillant", wheelIndex: 5, level: 5, hpPct: 100 },
    ]);
    for (let i = 0; i < 80 && engine.getState().phase === "fighting"; i++) {
      engine.tickTurn();
    }
    assert.equal(engine.getState().phase, "won");
  });

  it("computeStoryStars", () => {
    assert.equal(
      computeStoryStars(level, {
        phase: "lost",
        round: 3,
        events: [],
        allyInstanceIds: ["a1"],
      }),
      0,
    );

    assert.equal(
      computeStoryStars(level, {
        phase: "won",
        round: 20,
        events: [{ kind: "ko", targetId: "a1" }],
        allyInstanceIds: ["a1"],
      }),
      1,
    );

    assert.equal(
      computeStoryStars(level, {
        phase: "won",
        round: 20,
        events: [],
        allyInstanceIds: ["a1"],
      }),
      2,
    );

    assert.equal(
      computeStoryStars(level, {
        phase: "won",
        round: level.starsRound3,
        events: [],
        allyInstanceIds: ["a1"],
      }),
      3,
    );
  });

  it("computeStoryGoldReward — first clear > replay", () => {
    const first = computeStoryGoldReward(level, 3, true);
    const replay = computeStoryGoldReward(level, 3, false);
    assert.ok(first > replay);
    assert.ok(replay >= 8);
  });
});
