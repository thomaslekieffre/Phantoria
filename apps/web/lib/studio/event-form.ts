import type {
  CaptureBoostEventConfig,
  GachaBannerEventConfig,
  HubEventKind,
} from "@/lib/hub/event-mechanics";
import { rowToHubEventDef } from "@/lib/hub/event-mechanics";
import type { HubEventRow } from "@/app/api/studio/hub-events/route";

export type EventFormState = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
  kind: HubEventKind;
  priority: number;
  captureBonus: string;
  captureLabel: string;
  tribesCsv: string;
  raritiesCsv: string;
  poolId: string;
  ticketCost: string;
  gemCost: string;
  multiCount: string;
  featuredCsv: string;
  rateUpCsv: string;
  gachaLabel: string;
};

export const EVENT_KIND_OPTIONS: { value: HubEventKind; label: string }[] = [
  { value: "banner", label: "Bannière (affichage)" },
  { value: "capture_boost", label: "Boost capture (run)" },
  { value: "gacha_banner", label: "Bannière gacha" },
];

export function emptyEventForm(): EventFormState {
  return {
    id: "",
    title: "",
    subtitle: "",
    href: "/events",
    active: false,
    starts_at: "",
    ends_at: "",
    kind: "banner",
    priority: 0,
    captureBonus: "0.12",
    captureLabel: "Bonus capture",
    tribesCsv: "",
    raritiesCsv: "",
    poolId: "event-pool",
    ticketCost: "1",
    gemCost: "50",
    multiCount: "10",
    featuredCsv: "",
    rateUpCsv: "",
    gachaLabel: "",
  };
}

export function eventFormFromRow(row: HubEventRow): EventFormState {
  const def = rowToHubEventDef(row);
  const base = emptyEventForm();
  const form: EventFormState = {
    ...base,
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    active: row.active,
    starts_at: row.starts_at ? row.starts_at.slice(0, 16) : "",
    ends_at: row.ends_at ? row.ends_at.slice(0, 16) : "",
    kind: def.kind,
    priority: def.priority,
  };

  if (def.kind === "capture_boost") {
    const c = def.config as CaptureBoostEventConfig;
    form.captureBonus = String(c.captureBonus ?? 0);
    form.captureLabel = c.label ?? "";
    form.tribesCsv = (c.tribes ?? []).join(", ");
    form.raritiesCsv = (c.rarities ?? []).join(", ");
  }
  if (def.kind === "gacha_banner") {
    const c = def.config as GachaBannerEventConfig;
    form.poolId = c.poolId ?? "";
    form.ticketCost = c.ticketCost != null ? String(c.ticketCost) : "";
    form.gemCost = c.gemCost != null ? String(c.gemCost) : "";
    form.multiCount = c.multiCount != null ? String(c.multiCount) : "";
    form.featuredCsv = (c.featuredHubIds ?? []).join(", ");
    form.rateUpCsv = (c.rateUpRarities ?? []).join(", ");
    form.gachaLabel = c.label ?? "";
  }
  return form;
}

function csvList(s: string): string[] | undefined {
  const list = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export function buildEventConfig(form: EventFormState): Record<string, unknown> {
  if (form.kind === "banner") return {};
  if (form.kind === "capture_boost") {
    const cfg: Record<string, unknown> = {
      captureBonus: Number(form.captureBonus),
    };
    if (form.captureLabel.trim()) cfg.label = form.captureLabel.trim();
    const tribes = csvList(form.tribesCsv);
    const rarities = csvList(form.raritiesCsv);
    if (tribes) cfg.tribes = tribes;
    if (rarities) cfg.rarities = rarities;
    return cfg;
  }
  const cfg: Record<string, unknown> = { poolId: form.poolId.trim() };
  if (form.ticketCost.trim()) cfg.ticketCost = Number(form.ticketCost);
  if (form.gemCost.trim()) cfg.gemCost = Number(form.gemCost);
  if (form.multiCount.trim()) cfg.multiCount = Number(form.multiCount);
  const featured = csvList(form.featuredCsv);
  const rateUp = csvList(form.rateUpCsv);
  if (featured) cfg.featuredHubIds = featured;
  if (rateUp) cfg.rateUpRarities = rateUp;
  if (form.gachaLabel.trim()) cfg.label = form.gachaLabel.trim();
  return cfg;
}

export function validateEventForm(form: EventFormState): string | null {
  if (!form.id.trim()) return "ID requis";
  if (!form.title.trim() || !form.subtitle.trim()) return "Titre et sous-titre requis";
  if (form.kind === "capture_boost") {
    const b = Number(form.captureBonus);
    if (!Number.isFinite(b) || b < 0) return "Bonus capture invalide";
  }
  if (form.kind === "gacha_banner" && !form.poolId.trim()) return "poolId requis pour gacha event";
  return null;
}

export function eventPayloadFromForm(form: EventFormState) {
  return {
    id: form.id.trim(),
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    href: form.href.trim() || "/events",
    active: form.active,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    kind: form.kind,
    priority: form.priority,
    config: buildEventConfig(form),
  };
}
