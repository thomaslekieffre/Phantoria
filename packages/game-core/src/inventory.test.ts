import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inventoryToRunBalls,
  normalizeInventory,
  runBallsToInventory,
  STARTER_INVENTORY,
} from "./inventory";

describe("inventory", () => {
  it("convertit inventaire → balls combat", () => {
    const balls = inventoryToRunBalls({ ball_standard: 3, ball_lumi: 2, heal_small: 1 });
    assert.equal(balls.standard, 3);
    assert.equal(balls.tribal.lumi, 2);
  });

  it("round-trip balls inventaire", () => {
    const inv = normalizeInventory({ ball_standard: 2, ball_neant: 1 });
    const back = runBallsToInventory(inventoryToRunBalls(inv));
    assert.equal(back.ball_standard, 2);
    assert.equal(back.ball_neant, 1);
  });

  it("starter pack défini", () => {
    assert.ok((STARTER_INVENTORY.ball_standard ?? 0) >= 1);
  });
});
