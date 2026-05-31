import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCaptureChance, computeDamage, soulGainFromDamage } from "./formulas";
import { getTypeMultiplier, getMatchupsVs } from "./tribes";
import { createBattle, createRunBattle, DEV_ALLY_SETUP, type CombatEngine } from "./combat-engine";
import { applyRunReward, rollRewardChoices, rollShopOffers, getShopPrice, RUN_REWARD_POOL, RUN_START_GOLD, waveClearGold, isPersistentRunRelic, getRunRelicDisplay } from "./run-rewards";
import { getRunWaveKind, getRunWaveSetup, RUN_MAX_WAVES } from "./run-waves";
import { ALL_SPIRIT_KEYS } from "./characters";

/** Simule un tour complet */
function tickCombat(engine: CombatEngine): boolean {
  return engine.tickTurn();
}

describe("tribus", () => {
  it("super efficace vaillants → sombres", () => {
    assert.equal(getTypeMultiplier("vaillants", "sombres"), 2);
  });

  it("peu efficace vaillants → mysterieux", () => {
    assert.equal(getTypeMultiplier("vaillants", "mysterieux"), 0.5);
  });

  it("immunité néants → perfides", () => {
    assert.equal(getTypeMultiplier("neants", "perfides"), 0);
  });

  it("neutre si absent du tableau", () => {
    assert.equal(getTypeMultiplier("vaillants", "mignons"), 1);
  });

  it("matchups vs sombres", () => {
    const m = getMatchupsVs("sombres");
    assert.ok(m.strong.includes("vaillants"));
    assert.ok(m.weak.includes("mysterieux"));
  });
});

describe("formules", () => {
  it("dégâts minimum 1", () => {
    assert.ok(computeDamage(5, 100, 1, "mignons", "costauds") >= 1);
  });

  it("capture clampée entre 5 % et 85 %", () => {
    assert.equal(computeCaptureChance("S", 1, "standard"), 0.05);
    assert.equal(computeCaptureChance("E", 0, "standard"), 0.85);
    assert.ok(computeCaptureChance("E", 0.4, "standard") <= 0.85);
  });

  it("capture bonus PV bas", () => {
    const low = computeCaptureChance("C", 0.1, "standard");
    const high = computeCaptureChance("C", 0.9, "standard");
    assert.ok(low > high);
  });

  it("âmes progressives", () => {
    const g = soulGainFromDamage(30, 100);
    assert.ok(g > 0 && g < 1);
  });
});

describe("combat", () => {
  it("vague 1 solo = 1 ennemi facile", () => {
    const setup = getRunWaveSetup(1, 1);
    assert.equal(setup.enemyKeys.length, 1);
    assert.equal(setup.enemyKeys[0], "ombre_faible");
    assert.equal(setup.enemyLevel, 3);
  });

  it("vagues suivantes — esprits du pool partagé", () => {
    const setup = getRunWaveSetup(4, 2, () => 0.42);
    assert.ok(setup.enemyKeys.length >= 2);
    assert.ok(setup.enemyKeys.every((k) => (ALL_SPIRIT_KEYS as readonly string[]).includes(k)));
    assert.ok(new Set(setup.enemyKeys).size >= 1);
  });

  it("run roguelite démarre avec 1 esprit sur la roue", () => {
    const engine = createRunBattle();
    const s = engine.getState();
    assert.equal(s.combatants.filter((c) => c.side === "ally").length, 1);
    assert.equal(s.combatants.filter((c) => c.side === "ally" && c.active).length, 1);
    assert.equal(engine.getWheelSlots().filter(Boolean).length, 1);
    assert.equal(s.combatants.filter((c) => c.side === "enemy").length, 1);
  });

  it("crée une bataille démo avec 4 alliés sur la roue et 2 ennemis", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const s = engine.getState();
    assert.equal(s.combatants.filter((c) => c.side === "ally").length, 4);
    assert.equal(s.combatants.filter((c) => c.side === "ally" && c.active).length, 3);
    assert.equal(engine.getWheelSlots().filter(Boolean).length, 4);
    assert.equal(s.combatants.filter((c) => c.side === "enemy").length, 2);
  });

  it("attaque réduit les PV", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const actor = engine.getCurrentActor();
    if (actor?.side !== "ally") return;

    const foe = engine.getState().combatants.find((c) => c.side === "enemy")!;
    const hpBefore = foe.hp;
    assert.ok(tickCombat(engine));
    const hpAfter = engine.getCombatant(foe.instanceId)!.hp;
    assert.ok(hpAfter < hpBefore);
  });

  it("tickTurn résout le tour allié — premier ennemi par défaut", () => {
    const engine = createRunBattle();
    let actor = engine.getCurrentActor();
    if (actor?.side !== "ally") {
      engine.tickTurn();
      actor = engine.getCurrentActor();
    }
    assert.equal(actor?.side, "ally");
    const foes = engine.getState().combatants.filter((c) => c.side === "enemy" && !c.ko);
    const first = foes[0]!;
    const hpBefore = first.hp;
    assert.ok(engine.tickTurn());
    assert.ok(first.hp < hpBefore);
  });

  it("setAttackFocus oriente l'attaque de base alliée", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const foes = engine.getState().combatants.filter((c) => c.side === "enemy" && !c.ko);
    const second = foes[1]!;
    assert.ok(engine.setAttackFocus(second.instanceId));

    let actor = engine.getCurrentActor();
    if (actor?.side !== "ally") {
      engine.tickTurn();
      actor = engine.getCurrentActor();
    }
    assert.equal(actor?.side, "ally");

    const hpBefore = second.hp;
    assert.ok(engine.tickTurn());
    assert.ok(second.hp < hpBefore);
  });

  it("setAttackFocus refuse une cible invalide", () => {
    const engine = createRunBattle();
    const ally = engine.getState().combatants.find((c) => c.side === "ally")!;
    assert.equal(engine.setAttackFocus(ally.instanceId), false);
  });

  it("continue après KO d'un ennemi mid-manche", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const foes = engine.getState().combatants.filter((c) => c.side === "enemy");
    const first = foes[0]!;

    for (let i = 0; i < 80 && !first.ko && engine.getState().phase === "fighting"; i += 1) {
      tickCombat(engine);
    }

    assert.equal(first.ko, true);
    assert.equal(engine.getState().phase, "fighting");

    for (let i = 0; i < 40 && engine.getState().phase === "fighting"; i += 1) {
      tickCombat(engine);
    }

    assert.equal(engine.getState().phase, "reward_pick");
  });

  it("conserve les Âmes entre les vagues", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const ally = engine.getState().combatants.find((c) => c.side === "ally")!;

    for (const e of engine.getState().combatants.filter((c) => c.side === "enemy")) {
      e.ko = true;
      e.hp = 0;
    }
    ally.souls = 0.75;

    const s = engine.getState();
    const allyIdx = s.turnQueue.findIndex((id) => engine.getCombatant(id)?.side === "ally");
    s.queueIndex = allyIdx >= 0 ? allyIdx : 0;
    engine.tickTurn();
    assert.equal(engine.getState().phase, "reward_pick");
    const pick = engine.getState().rewardChoices![0]!;
    engine.selectReward(pick.id);
    engine.continueAfterReward();

    assert.equal(engine.getCombatant(ally.instanceId)?.souls, 0.75);
    assert.equal(engine.getState().wave, 2);
    assert.equal(engine.getState().phase, "fighting");
  });

  it("pas de défaite si un seul allié KO et des vivants en réserve", () => {
    const engine = createBattle({
      allySetup: [
        { key: "kiro_perfide", wheelIndex: 5 },
        { key: "luma_mignon", wheelIndex: 4 },
        { key: "nyx_mysterieux", wheelIndex: 3 },
        { key: "bram_vaillant", wheelIndex: 2 },
      ],
    });
    const kiro = engine.getState().combatants.find((c) => c.templateKey === "kiro_perfide")!;
    assert.equal(kiro.active, true);

    kiro.hp = 0;
    kiro.ko = true;
    kiro.active = false;

    for (let i = 0; i < 8; i += 1) tickCombat(engine);

    assert.equal(engine.getState().phase, "fighting");
    assert.equal(
      engine.getState().combatants.filter((c) => c.side === "ally" && !c.ko).length,
      3,
    );
  });

  it("auto-rotation quand le terrain est vide", () => {
    const engine = createBattle({
      allySetup: [
        { key: "kiro_perfide", wheelIndex: 5 },
        { key: "luma_mignon", wheelIndex: 4 },
        { key: "nyx_mysterieux", wheelIndex: 3 },
        { key: "bram_vaillant", wheelIndex: 2 },
      ],
    });
    const kiro = engine.getState().combatants.find((c) => c.templateKey === "kiro_perfide")!;

    while (kiro.hp > 0 && engine.getState().phase === "fighting") {
      tickCombat(engine);
    }

    assert.equal(kiro.ko, true);
    assert.equal(engine.getState().phase, "fighting");
    const onField = engine.getState().combatants.filter((c) => c.side === "ally" && c.active && !c.ko);
    assert.ok(onField.length >= 1);
    assert.ok(
      engine.getState().events.some((e) => e.kind === "wheel_rotate" && e.text.includes("auto")),
    );
  });

  it("rotation permute terrain et réserve", () => {
    const engine = createBattle({
      allySetup: [...DEV_ALLY_SETUP],
      enemyKeys: ["ombre_faible", "ombre_faible"],
      enemyLevel: 4,
    });
    const kiro = engine.getState().combatants.find((c) => c.templateKey === "kiro_perfide")!;
    assert.equal(kiro.active, false);
    assert.equal(kiro.wheelIndex, 2);

    engine.rotateWheel("cw");
    engine.rotateWheel("cw");
    engine.rotateWheel("cw");
    assert.equal(kiro.wheelIndex, 5);
    assert.equal(kiro.active, true);

    const bram = engine.getState().combatants.find((c) => c.templateKey === "bram_vaillant")!;
    assert.equal(bram.active, false);
  });

  it("capture conserve les stats du combat", () => {
    const engine = createRunBattle();
    const foe = engine.getState().combatants.find((c) => c.side === "enemy")!;
    foe.hp = Math.floor(foe.maxHp * 0.1);
    const { hp, atk, def, vit, maxHp, level } = foe;

    assert.ok(engine.tryCapture(foe.instanceId, "standard", () => 0));
    assert.ok(engine.completeCapturePlacement(2));

    const recruit = engine.getState().combatants.find(
      (c) => c.side === "ally" && c.templateKey === foe.templateKey,
    )!;
    assert.equal(recruit.hp, hp);
    assert.equal(recruit.maxHp, maxHp);
    assert.equal(recruit.atk, atk);
    assert.equal(recruit.def, def);
    assert.equal(recruit.vit, vit);
    assert.equal(recruit.level, level);
  });

  it("échec capture ne tue pas l'ennemi", () => {
    const engine = createRunBattle();
    const foe = engine.getState().combatants.find((c) => c.side === "enemy")!;
    foe.hp = Math.floor(foe.maxHp * 0.2);
    const hpBefore = foe.hp;

    assert.equal(engine.tryCapture(foe.instanceId, "standard", () => 1), false);
    assert.equal(foe.ko, false);
    assert.equal(foe.hp, hpBefore);
    assert.equal(engine.getState().phase, "fighting");
  });

  it("capture sur slot occupé remplace l'esprit", () => {
    const engine = createBattle({
      allySetup: [
        { key: "bram_vaillant", wheelIndex: 5 },
        { key: "nyx_mysterieux", wheelIndex: 0 },
        { key: "luma_mignon", wheelIndex: 1 },
        { key: "kiro_perfide", wheelIndex: 2 },
        { key: "ombre_faible", wheelIndex: 3 },
        { key: "neant_scout", wheelIndex: 4 },
      ],
    });
    const foe = engine.getState().combatants.find((c) => c.side === "enemy")!;
    foe.hp = Math.floor(foe.maxHp * 0.1);

    assert.ok(engine.tryCapture(foe.instanceId, "standard", () => 0));
    assert.equal(engine.getState().pendingRecruit?.templateKey, foe.templateKey);
    assert.equal(engine.getState().combatants.filter((c) => c.side === "ally").length, 6);

    assert.ok(engine.completeCapturePlacement(2));
    assert.equal(engine.getState().pendingRecruit, null);
    assert.equal(engine.getState().combatants.filter((c) => c.side === "ally").length, 6);
    assert.ok(
      engine.getState().combatants.some(
        (c) => c.side === "ally" && c.templateKey === foe.templateKey && c.wheelIndex === 2,
      ),
    );
    assert.ok(
      !engine.getState().combatants.some(
        (c) => c.side === "ally" && c.templateKey === "kiro_perfide",
      ),
    );
  });
});

describe("récompenses de vague", () => {
  it("propose 3 objets uniques", () => {
    const choices = rollRewardChoices(1, [], 3, () => 0.5);
    assert.equal(choices.length, 3);
    assert.equal(new Set(choices.map((c) => c.id)).size, 3);
  });

  it("selectReward + continueAfterReward lance la vague suivante", () => {
    const engine = createRunBattle();
    const foe = engine.getState().combatants.find((c) => c.side === "enemy")!;
    foe.hp = 0;
    foe.ko = true;

    const pick = RUN_REWARD_POOL.find((r) => r.id === "griffe_ardente")!;
    engine.getState().phase = "reward_pick";
    engine.getState().rewardChoices = [pick];
    engine.getState().shopOffers = rollShopOffers(1, []);

    assert.ok(engine.selectReward(pick.id));
    assert.equal(engine.getState().phase, "reward_pick");
    assert.equal(engine.getState().freeRewardPicked, true);
    assert.ok(engine.continueAfterReward());
    assert.equal(engine.getState().phase, "fighting");
    assert.equal(engine.getState().wave, 2);
    assert.ok(engine.getState().runRelics.includes(pick.id));
  });

  it("run démarre avec 100 €", () => {
    const engine = createRunBattle();
    assert.equal(engine.getState().runGold, RUN_START_GOLD);
  });

  it("boutique — achat déduit l'or et applique l'effet", () => {
    const engine = createRunBattle();
    const heal = RUN_REWARD_POOL.find((r) => r.id === "lanterne_soin")!;
    const price = getShopPrice(heal, 1);
    engine.getState().phase = "reward_pick";
    engine.getState().freeRewardPicked = true;
    engine.getState().runGold = price + 5;
    engine.getState().shopOffers = [{ rewardId: heal.id, price }];

    const ally = engine.getState().combatants.find((c) => c.side === "ally")!;
    ally.hp = Math.floor(ally.maxHp * 0.4);
    const hpBefore = ally.hp;

    assert.ok(engine.buyShopOffer(heal.id));
    assert.equal(engine.getState().runGold, 5);
    assert.ok(ally.hp > hpBefore);
  });

  it("continueAfterReward refuse sans récompense gratuite", () => {
    const engine = createRunBattle();
    engine.getState().phase = "reward_pick";
    engine.getState().shopOffers = rollShopOffers(1, []);
    assert.equal(engine.continueAfterReward(), false);
  });

  it("soin instantané n'apparaît pas dans les reliques", () => {
    const engine = createRunBattle();
    engine.getState().phase = "reward_pick";
    engine.getState().rewardChoices = [RUN_REWARD_POOL.find((r) => r.id === "lanterne_soin")!];

    assert.ok(engine.selectReward("lanterne_soin"));
    assert.ok(engine.continueAfterReward());
    assert.equal(engine.getState().runRelics.length, 0);
    assert.equal(getRunRelicDisplay(engine.getState().runRelics).length, 0);
  });

  it("soin restaure les PV", () => {
    const engine = createRunBattle();
    const ally = engine.getState().combatants.find((c) => c.side === "ally")!;
    ally.hp = Math.floor(ally.maxHp * 0.3);
    const heal = RUN_REWARD_POOL.find((r) => r.id === "lanterne_soin")!;

    applyRunReward(engine.getState(), heal);

    assert.ok(ally.hp > ally.maxHp * 0.3);
  });

  it("rollShopOffers propose des prix cohérents", () => {
    const offers = rollShopOffers(5, [], 5, () => 0.1);
    assert.ok(offers.length >= 1);
    for (const o of offers) {
      const def = RUN_REWARD_POOL.find((r) => r.id === o.rewardId);
      assert.ok(def);
      assert.equal(o.price, getShopPrice(def!, 5));
    }
  });

  it("waveClearGold bonus sur boss", () => {
    assert.ok(waveClearGold(10, "boss") > waveClearGold(9, "normal"));
  });
});

describe("vagues run", () => {
  it("200 vagues max avec paliers boss", () => {
    assert.equal(RUN_MAX_WAVES, 200);
    assert.equal(getRunWaveKind(9), "normal");
    assert.equal(getRunWaveKind(10), "boss");
    assert.equal(getRunWaveKind(50), "mega_boss");
    assert.equal(getRunWaveKind(100), "mega_boss");
    assert.equal(getRunWaveKind(200), "final_boss");
  });

  it("vague 10 = Gardien + sbires", () => {
    const setup = getRunWaveSetup(10, 1, () => 0);
    assert.equal(setup.kind, "boss");
    assert.equal(setup.enemyKeys[0], "boss_gardien");
    assert.ok(setup.enemyKeys.length >= 2);
  });

  it("vague 50 = Colosse", () => {
    const setup = getRunWaveSetup(50, 3, () => 0);
    assert.equal(setup.kind, "mega_boss");
    assert.equal(setup.enemyKeys[0], "boss_colosse");
  });

  it("vague 200 = Solmaar final", () => {
    const setup = getRunWaveSetup(200, 3, () => 0);
    assert.equal(setup.kind, "final_boss");
    assert.equal(setup.enemyKeys[0], "boss_solmaar");
  });

  it("victoire après récompense vague 200", () => {
    const engine = createRunBattle();
    const pick = RUN_REWARD_POOL.find((r) => r.id === "griffe_ardente")!;
    engine.getState().wave = RUN_MAX_WAVES;
    engine.getState().phase = "reward_pick";
    engine.getState().rewardChoices = [pick];
    engine.getState().shopOffers = rollShopOffers(RUN_MAX_WAVES, []);

    assert.ok(engine.selectReward(pick.id));
    assert.ok(engine.continueAfterReward());
    assert.equal(engine.getState().phase, "won");
    assert.equal(engine.getState().wave, RUN_MAX_WAVES);
  });
});
