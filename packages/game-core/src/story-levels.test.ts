import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStoryBattle } from "./combat-engine";
import { computeStoryStars, getStoryLevel } from "./story-levels";

describe("story mode", () => {
  const level = getStoryLevel("1-1");
  if (!level) throw new Error("missing level 1-1");

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
});
