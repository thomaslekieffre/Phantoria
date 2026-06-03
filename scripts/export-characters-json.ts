/** Valide data/characters.json et vérifie que game-core charge le catalogue. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_SPIRIT_KEYS, getTemplate } from "../packages/game-core/src/characters.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = join(root, "data", "characters.json");

const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as {
  catalog?: Record<string, unknown>;
  enemies?: Record<string, unknown>;
};

if (!raw.catalog || !raw.enemies) {
  throw new Error("characters.json doit contenir catalog et enemies");
}

const jsonKeys = new Set([...Object.keys(raw.catalog), ...Object.keys(raw.enemies)]);
for (const key of ALL_SPIRIT_KEYS) {
  getTemplate(key);
  if (!jsonKeys.has(key)) {
    throw new Error(`Clé ${key} absente de characters.json`);
  }
}

console.log(`OK — ${ALL_SPIRIT_KEYS.length} esprits dans data/characters.json`);
