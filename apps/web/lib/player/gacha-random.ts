import { randomInt } from "crypto";

/** RNG serveur pour les tirages gacha (non prévisible côté client). */
export function secureGachaRandom(): number {
  return randomInt(0, 2 ** 32) / 2 ** 32;
}
