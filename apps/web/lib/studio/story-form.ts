import type { StoryEnemySetup } from "@phantoria/game-core";
import type { StoryLevelRow } from "@/app/api/studio/story/route";

export type EnemyRowForm = {
  key: string;
  level: string;
  statMult: string;
};

export type StoryLevelFormState = {
  id: string;
  zone_id: number;
  level_index: number;
  title: string;
  intro: string;
  outro: string;
  enemies: EnemyRowForm[];
  stars_round3: number;
  active: boolean;
};

export function emptyEnemyRow(): EnemyRowForm {
  return { key: "ombre_faible", level: "1", statMult: "1" };
}

export function emptyStoryLevelForm(zoneId = 1): StoryLevelFormState {
  return {
    id: "",
    zone_id: zoneId,
    level_index: 1,
    title: "",
    intro: "",
    outro: "",
    enemies: [emptyEnemyRow()],
    stars_round3: 10,
    active: true,
  };
}

export function storyFormFromRow(row: StoryLevelRow): StoryLevelFormState {
  const enemies = Array.isArray(row.enemies) ? (row.enemies as StoryEnemySetup[]) : [];
  return {
    id: row.id,
    zone_id: row.zone_id,
    level_index: row.level_index,
    title: row.title,
    intro: row.intro,
    outro: row.outro,
    enemies: enemies.length
      ? enemies.map((e) => ({
          key: e.key,
          level: String(e.level ?? 1),
          statMult: String(e.statMult ?? 1),
        }))
      : [emptyEnemyRow()],
    stars_round3: row.stars_round3,
    active: row.active,
  };
}

export function buildStoryEnemies(rows: EnemyRowForm[]): { enemies: StoryEnemySetup[]; error?: string } {
  const enemies: StoryEnemySetup[] = [];
  for (const r of rows) {
    const key = r.key.trim();
    if (!key) continue;
    const level = Number(r.level);
    const statMult = Number(r.statMult);
    if (!Number.isFinite(level) || level < 1) {
      return { enemies: [], error: `Niveau invalide pour ${key}` };
    }
    if (!Number.isFinite(statMult) || statMult <= 0) {
      return { enemies: [], error: `statMult invalide pour ${key}` };
    }
    enemies.push({ key, level, statMult });
  }
  if (enemies.length === 0) return { enemies: [], error: "Au moins un ennemi requis" };
  return { enemies };
}

export function storyPayloadFromForm(form: StoryLevelFormState) {
  const { enemies, error } = buildStoryEnemies(form.enemies);
  if (error) return { error, body: null };
  return {
    error: null as string | null,
    body: {
      id: form.id.trim(),
      zone_id: form.zone_id,
      level_index: form.level_index,
      title: form.title.trim(),
      intro: form.intro,
      outro: form.outro,
      enemies,
      stars_round3: form.stars_round3,
      active: form.active,
    },
  };
}
