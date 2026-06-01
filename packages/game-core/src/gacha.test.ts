import assert from "node:assert/strict";
import test from "node:test";
import { getSRateAtPity, GACHA_HARD_PITY, nextPityCounter, rollGachaRarity } from "./gacha";

test("getSRateAtPity — hard pity à 100", () => {
  assert.equal(getSRateAtPity(100), 1);
  assert.equal(getSRateAtPity(150), 1);
});

test("getSRateAtPity — soft pity", () => {
  assert.equal(getSRateAtPity(0), 0.01);
  assert.equal(getSRateAtPity(50), 0.02);
  assert.equal(getSRateAtPity(99), 0.25);
});

test("rollGachaRarity — hard pity force S", () => {
  assert.equal(rollGachaRarity(GACHA_HARD_PITY, () => 0.99), "S");
});

test("nextPityCounter", () => {
  assert.equal(nextPityCounter(49, "S"), 0);
  assert.equal(nextPityCounter(49, "E"), 50);
});
