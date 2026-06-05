import type { CharacterTemplate, Rarity, SkillTemplate, Targeting, Tribe } from "@phantoria/game-core";
import { RARITIES, TRIBES } from "@phantoria/game-core";

export type SkillSlotKey = "basic" | "special1" | "special2";

export type SkillFormState = {
  id: string;
  name: string;
  power: string;
  targeting: Targeting;
  description: string;
  tribeBonus: boolean;
};

export type SpiritFormState = {
  template_key: string;
  kind: "catalog" | "enemy";
  hub_id: string;
  name: string;
  tribe: Tribe;
  rarity: Rarity;
  hp: string;
  atk: string;
  def: string;
  vit: string;
  skills: Record<SkillSlotKey, SkillFormState>;
  active: boolean;
  sort_order: number;
  portrait_url: string;
};

const SKILL_SLOTS: { key: SkillSlotKey; label: string }[] = [
  { key: "basic", label: "Attaque de base" },
  { key: "special1", label: "Spécial 1" },
  { key: "special2", label: "Spécial 2" },
];

export const SKILL_SLOT_META = SKILL_SLOTS;
export const TRIBE_OPTIONS = TRIBES;
export const RARITY_OPTIONS = RARITIES;

const TARGETINGS: Targeting[] = ["single", "random", "aoe"];

export const TARGETING_OPTIONS: { value: Targeting; label: string }[] = [
  { value: "single", label: "Cible unique" },
  { value: "random", label: "Cible aléatoire" },
  { value: "aoe", label: "Zone (tous)" },
];

function emptySkill(prefix: string, slot: SkillSlotKey): SkillFormState {
  const slotId = slot === "basic" ? "basic" : slot;
  return {
    id: `${prefix}_${slotId}`,
    name: slot === "basic" ? "Attaque" : `Spécial ${slot === "special1" ? "1" : "2"}`,
    power: slot === "basic" ? "1" : "1.4",
    targeting: slot === "special2" ? "aoe" : "single",
    description: "",
    tribeBonus: false,
  };
}

export function emptySpiritForm(): SpiritFormState {
  return {
    template_key: "",
    kind: "catalog",
    hub_id: "",
    name: "",
    tribe: "vaillants",
    rarity: "E",
    hp: "100",
    atk: "18",
    def: "12",
    vit: "10",
    skills: {
      basic: emptySkill("new", "basic"),
      special1: emptySkill("new", "special1"),
      special2: emptySkill("new", "special2"),
    },
    active: true,
    sort_order: 0,
    portrait_url: "",
  };
}

function skillFromTemplate(s: SkillTemplate | undefined, fallback: SkillFormState, tribe: Tribe): SkillFormState {
  if (!s) return fallback;
  return {
    id: s.id ?? fallback.id,
    name: s.name ?? fallback.name,
    power: String(s.power ?? 1),
    targeting: s.targeting ?? "single",
    description: s.description ?? "",
    tribeBonus: Boolean(s.tribe && s.tribe === tribe),
  };
}

function skillFromLegacy(raw: Record<string, unknown>, fallback: SkillFormState): SkillFormState {
  return {
    id: String(raw.id ?? fallback.id),
    name: String(raw.name ?? fallback.name),
    power: String(raw.power ?? raw.dmg ?? 1),
    targeting: (raw.targeting as Targeting) ?? "single",
    description: String(raw.description ?? ""),
    tribeBonus: false,
  };
}

/** Parse payload DB (CharacterTemplate ou ancien format JSON libre). */
export function spiritFormFromPayload(
  row: {
    template_key: string;
    kind: "catalog" | "enemy";
    hub_id: string | null;
    name: string;
    tribe: string;
    rarity: string;
    payload: unknown;
    active: boolean;
    sort_order: number;
    portrait_url?: string | null;
  },
): SpiritFormState {
  const p = row.payload as Record<string, unknown>;
  const base = (p.base ?? p) as Record<string, unknown>;
  const tribe = (row.tribe || p.tribe || "vaillants") as Tribe;
  const prefix = row.template_key || "spirit";

  const empty = emptySpiritForm();
  const skillsRaw = p.skills as Record<string, unknown> | undefined;

  let basic = empty.skills.basic;
  let special1 = empty.skills.special1;
  let special2 = empty.skills.special2;

  if (skillsRaw?.basic && typeof skillsRaw.basic === "object") {
    basic = skillFromTemplate(skillsRaw.basic as SkillTemplate, basic, tribe);
    special1 = skillFromTemplate(skillsRaw.special1 as SkillTemplate, special1, tribe);
    special2 = skillFromTemplate(skillsRaw.special2 as SkillTemplate, special2, tribe);
  } else if (Array.isArray(skillsRaw)) {
    const arr = skillsRaw as Record<string, unknown>[];
    if (arr[0]) basic = skillFromLegacy(arr[0], basic);
    if (arr[1]) special1 = skillFromLegacy(arr[1], special1);
    if (arr[2]) special2 = skillFromLegacy(arr[2], special2);
  }

  return {
    template_key: row.template_key,
    kind: row.kind,
    hub_id: row.hub_id ?? "",
    name: row.name || String(p.name ?? ""),
    tribe,
    rarity: (row.rarity || p.rarity || "E") as Rarity,
    hp: String(base.hp ?? 100),
    atk: String(base.atk ?? 18),
    def: String(base.def ?? 12),
    vit: String(base.vit ?? base.spd ?? 10),
    skills: { basic, special1, special2 },
    active: row.active,
    sort_order: row.sort_order,
    portrait_url: row.portrait_url ?? "",
  };
}

export function spiritFormFromTemplate(t: CharacterTemplate, meta: {
  template_key: string;
  kind: "catalog" | "enemy";
  hub_id: string | null;
  active: boolean;
  sort_order: number;
}): SpiritFormState {
  return spiritFormFromPayload({
    ...meta,
    name: t.name,
    tribe: t.tribe,
    rarity: t.rarity,
    payload: t,
  });
}

function parseSkill(slot: SkillFormState, tribe: Tribe): SkillTemplate | null {
  const id = slot.id.trim();
  const name = slot.name.trim();
  if (!id || !name) return null;
  const power = Number(slot.power);
  if (!Number.isFinite(power) || power < 0) return null;

  const skill: SkillTemplate = {
    id,
    name,
    power,
    targeting: slot.targeting,
  };
  if (slot.description.trim()) skill.description = slot.description.trim();
  if (slot.tribeBonus) skill.tribe = tribe;
  return skill;
}

export function buildCharacterPayload(form: SpiritFormState): { payload: CharacterTemplate; error?: string } {
  const key = form.template_key.trim();
  const name = form.name.trim();
  if (!key) return { payload: {} as CharacterTemplate, error: "Clé template requise" };
  if (!name) return { payload: {} as CharacterTemplate, error: "Nom requis" };

  const hp = Number(form.hp);
  const atk = Number(form.atk);
  const def = Number(form.def);
  const vit = Number(form.vit);
  if (![hp, atk, def, vit].every((n) => Number.isFinite(n) && n >= 0)) {
    return { payload: {} as CharacterTemplate, error: "Stats invalides (nombres ≥ 0)" };
  }

  const basic = parseSkill(form.skills.basic, form.tribe);
  const special1 = parseSkill(form.skills.special1, form.tribe);
  const special2 = parseSkill(form.skills.special2, form.tribe);
  if (!basic || !special1 || !special2) {
    return { payload: {} as CharacterTemplate, error: "Chaque skill doit avoir id, nom et puissance" };
  }

  const payload: CharacterTemplate = {
    key,
    name,
    tribe: form.tribe,
    rarity: form.rarity,
    base: { hp, atk, def, vit },
    skills: { basic, special1, special2 },
  };

  return { payload };
}

/** Sync skill ids when template_key changes (new spirit). */
export function syncSkillIds(form: SpiritFormState, templateKey: string): SpiritFormState {
  const prefix = templateKey.trim() || "spirit";
  const next = { ...form, template_key: templateKey };
  for (const slot of SKILL_SLOTS) {
    const cur = form.skills[slot.key];
    if (!cur.id || cur.id.startsWith("new_") || cur.id.startsWith("spirit_")) {
      next.skills = {
        ...next.skills,
        [slot.key]: { ...cur, id: `${prefix}_${slot.key === "basic" ? "basic" : slot.key}` },
      };
    }
  }
  return next;
}
