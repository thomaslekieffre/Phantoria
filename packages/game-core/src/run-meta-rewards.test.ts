import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeRunMetaReward } from "./run-meta-rewards";
import { RUN_MAX_WAVES } from "./run-waves";

describe("computeRunMetaReward", () => {
  it("défaite vague 1 donne au moins 1 ticket", () => {
    const r = computeRunMetaReward(1, "lost");
    assert.equal(r.tickets, 1);
    assert.equal(r.gems, 0);
  });

  it("victoire complète bonus", () => {
    const r = computeRunMetaReward(RUN_MAX_WAVES, "won");
    assert.ok(r.tickets >= 8);
    assert.ok(r.gems >= 40);
  });

  it("victoire partielle > défaite même vague", () => {
    const wave = 25;
    const win = computeRunMetaReward(wave, "won");
    const lose = computeRunMetaReward(wave, "lost");
    assert.ok(win.tickets > lose.tickets);
    assert.ok(win.gems >= lose.gems);
  });
});
