import type { RunRewardDef, RunRewardKind } from "@phantoria/game-core";
import type { RunRewardRow } from "@/app/api/studio/rewards/route";

export type RewardFormState = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  kind: RunRewardKind;
  value: string;
  stat: "" | "atk" | "def" | "vit" | "maxHp";
  stackable: boolean;
  sort_order: number;
  active: boolean;
};

export const REWARD_KIND_OPTIONS: { value: RunRewardKind; label: string }[] = [
  { value: "heal_all", label: "Soin toute la roue" },
  { value: "stat_all", label: "Stat +X (roue)" },
  { value: "combo_atk_def", label: "Combo ATK+DEF" },
  { value: "soul_mult", label: "Mult. âmes" },
  { value: "special_mult", label: "Mult. spéciaux" },
  { value: "capture_bonus", label: "Bonus capture" },
  { value: "soul_fill", label: "Remplir âmes" },
  { value: "ball_standard", label: "Phantoball standard" },
  { value: "ball_tribal", label: "Phantoball tribal" },
  { value: "xp_all", label: "XP équipe" },
];

export const REWARD_STAT_OPTIONS = [
  { value: "", label: "—" },
  { value: "atk", label: "ATK" },
  { value: "def", label: "DEF" },
  { value: "vit", label: "VIT" },
  { value: "maxHp", label: "PV max" },
] as const;

export function rewardPayloadPreview(payload: Record<string, unknown>, id: string) {
  return {
    name: typeof payload.name === "string" ? payload.name : id,
    emoji: typeof payload.emoji === "string" ? payload.emoji : "✨",
    kind: typeof payload.kind === "string" ? payload.kind : "",
  };
}

export function emptyRewardForm(): RewardFormState {
  return {
    id: "",
    name: "",
    emoji: "✨",
    description: "",
    kind: "stat_all",
    value: "5",
    stat: "atk",
    stackable: false,
    sort_order: 0,
    active: true,
  };
}

export function rewardFormFromRow(row: RunRewardRow): RewardFormState {
  const p = row.payload;
  const preview = rewardPayloadPreview(p, row.id);
  const kind =
    typeof p.kind === "string" && REWARD_KIND_OPTIONS.some((o) => o.value === p.kind)
      ? (p.kind as RunRewardKind)
      : "stat_all";
  const stat =
    typeof p.stat === "string" && REWARD_STAT_OPTIONS.some((o) => o.value === p.stat)
      ? (p.stat as RewardFormState["stat"])
      : "";
  return {
    id: row.id,
    name: preview.name,
    emoji: preview.emoji,
    description: typeof p.description === "string" ? p.description : "",
    kind,
    value: String(typeof p.value === "number" ? p.value : 0),
    stat,
    stackable: Boolean(p.stackable),
    sort_order: row.sort_order,
    active: row.active,
  };
}

export function buildRewardPayload(form: RewardFormState): { payload: RunRewardDef; error?: string } {
  const id = form.id.trim();
  const name = form.name.trim();
  if (!id || !name) return { payload: {} as RunRewardDef, error: "ID et nom requis" };

  const value = Number(form.value);
  if (!Number.isFinite(value)) return { payload: {} as RunRewardDef, error: "Valeur invalide" };

  const payload: RunRewardDef = {
    id,
    name,
    emoji: form.emoji.trim() || "✨",
    description: form.description.trim(),
    kind: form.kind,
    value,
  };
  if (form.kind === "stat_all" && form.stat) payload.stat = form.stat;
  if (form.stackable) payload.stackable = true;
  return { payload };
}
