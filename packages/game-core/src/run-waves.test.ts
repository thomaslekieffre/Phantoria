import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRunWaveSetup, RUN_MAX_WAVES } from "./run-waves";

describe("getRunWaveSetup", () => {
  it("vague boss ×10 utilise un esprit roster, pas boss_gardien", () => {
    const setup = getRunWaveSetup(10, 3, () => 0.42);
    assert.equal(setup.kind, "boss");
    assert.ok(!setup.enemyKeys.includes("boss_gardien"));
    assert.ok(!setup.enemyKeys.includes("boss_colosse"));
    assert.equal(setup.enemyKeys.length, 2);
  });

  it("méga boss ×50 utilise un esprit roster haute rareté", () => {
    const setup = getRunWaveSetup(50, 4, () => 0.42);
    assert.equal(setup.kind, "mega_boss");
    assert.ok(!setup.enemyKeys.includes("boss_colosse"));
    assert.equal(setup.enemyKeys.length, 3);
  });

  it("boss final vague 200 garde Solmaar", () => {
    const setup = getRunWaveSetup(RUN_MAX_WAVES, 4, () => 0.5);
    assert.equal(setup.kind, "final_boss");
    assert.equal(setup.enemyKeys[0], "boss_solmaar");
  });
});
