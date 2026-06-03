/** Mécaniques des events hub — kind + config JSON */

export type HubEventKind = "banner" | "capture_boost" | "gacha_banner";

/** Affichage seul (legacy / teaser sans effet gameplay) */
export type BannerEventConfig = Record<string, never>;

/** Bonus capture en run — s'additionne aux reliques runModifiers.captureBonus */
export type CaptureBoostEventConfig = {
  /** Ex: 0.12 = +12 pts de chance capture (additif, voir formulas.ts) */
  captureBonus: number;
  /** Filtre optionnel : seulement ces tribus (game-core tribe keys) */
  tribes?: string[];
  /** Filtre optionnel : seulement ces raretés */
  rarities?: string[];
  label?: string;
};

/** Bannière gacha limitée — pool dédié dans studio/gacha (pool_id) */
export type GachaBannerEventConfig = {
  /** ID du pool gacha (ex: event-perfides-2026) — gacha_pools + gacha_pool_entries */
  poolId: string;
  /** Coûts override (sinon pool DB ou standard) */
  ticketCost?: number;
  gemCost?: number;
  multiCount?: number;
  /** Esprits mis en avant (UI) */
  featuredHubIds?: string[];
  /** Rate-up sur certaines raretés dans le pool (affichage + futur pity) */
  rateUpRarities?: string[];
  label?: string;
};

export type HubEventConfigByKind = {
  banner: BannerEventConfig;
  capture_boost: CaptureBoostEventConfig;
  gacha_banner: GachaBannerEventConfig;
};

export type HubEventDef<K extends HubEventKind = HubEventKind> = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  kind: K;
  config: HubEventConfigByKind[K];
  priority: number;
};

/** Effets gameplay résolus depuis les events actifs */
export type GameEventEffects = {
  /** Bandeau principal (plus haute priority) */
  primary: HubEventDef | null;
  captureBonus: number;
  captureBoostEvents: HubEventDef<"capture_boost">[];
  gachaBanner: HubEventDef<"gacha_banner"> | null;
};

export function isWithinEventWindow(
  startsAt: string | null,
  endsAt: string | null,
  now = Date.now(),
): boolean {
  if (startsAt && Date.parse(startsAt) > now) return false;
  if (endsAt && Date.parse(endsAt) < now) return false;
  return true;
}

function parseConfig<K extends HubEventKind>(kind: K, raw: unknown): HubEventConfigByKind[K] {
  const cfg = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  if (kind === "capture_boost") {
    return {
      captureBonus: typeof cfg.captureBonus === "number" ? cfg.captureBonus : 0,
      tribes: Array.isArray(cfg.tribes) ? (cfg.tribes as string[]) : undefined,
      rarities: Array.isArray(cfg.rarities) ? (cfg.rarities as string[]) : undefined,
      label: typeof cfg.label === "string" ? cfg.label : undefined,
    } as HubEventConfigByKind[K];
  }
  if (kind === "gacha_banner") {
    return {
      poolId: typeof cfg.poolId === "string" ? cfg.poolId : "",
      ticketCost: typeof cfg.ticketCost === "number" ? cfg.ticketCost : undefined,
      gemCost: typeof cfg.gemCost === "number" ? cfg.gemCost : undefined,
      multiCount: typeof cfg.multiCount === "number" ? cfg.multiCount : undefined,
      featuredHubIds: Array.isArray(cfg.featuredHubIds) ? (cfg.featuredHubIds as string[]) : undefined,
      rateUpRarities: Array.isArray(cfg.rateUpRarities) ? (cfg.rateUpRarities as string[]) : undefined,
      label: typeof cfg.label === "string" ? cfg.label : undefined,
    } as HubEventConfigByKind[K];
  }
  return {} as HubEventConfigByKind[K];
}

export function rowToHubEventDef(row: {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  kind?: string;
  config?: unknown;
  priority?: number;
}): HubEventDef {
  const kind = (row.kind ?? "banner") as HubEventKind;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    active: row.active,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    kind,
    config: parseConfig(kind, row.config),
    priority: row.priority ?? 0,
  };
}

export function resolveGameEventEffects(events: HubEventDef[], now = Date.now()): GameEventEffects {
  const live = events
    .filter((e) => e.active && isWithinEventWindow(e.starts_at, e.ends_at, now))
    .sort((a, b) => b.priority - a.priority);

  const captureBoostEvents = live.filter((e): e is HubEventDef<"capture_boost"> => e.kind === "capture_boost");
  const captureBonus = captureBoostEvents.reduce(
    (sum, e) => sum + (e.config.captureBonus ?? 0),
    0,
  );

  const gachaBanner = live.find((e): e is HubEventDef<"gacha_banner"> => e.kind === "gacha_banner") ?? null;

  return {
    primary: live[0] ?? null,
    captureBonus,
    captureBoostEvents,
    gachaBanner,
  };
}

/** @deprecated compat bandeau sans mécanique */
export type HubEvent = Pick<HubEventDef, "id" | "title" | "subtitle" | "href" | "active">;

export function toHubEventBanner(def: HubEventDef | null): HubEvent | null {
  if (!def) return null;
  return { id: def.id, title: def.title, subtitle: def.subtitle, href: def.href, active: def.active };
}

export type HubEventDisplayStatus = "live" | "upcoming" | "ended";

export function hubEventDisplayStatus(def: HubEventDef, now = Date.now()): HubEventDisplayStatus {
  if (def.ends_at && Date.parse(def.ends_at) < now) return "ended";
  if (def.starts_at && Date.parse(def.starts_at) > now) return "upcoming";
  return "live";
}

/** Bandeau hub / page events : priorité parmi live, sinon le prochain à venir. */
export function pickHubEventForDisplay(events: HubEventDef[], now = Date.now()): HubEventDef | null {
  const sorted = [...events]
    .filter((e) => e.active && hubEventDisplayStatus(e, now) !== "ended")
    .sort((a, b) => {
      const statusOrder = { live: 0, upcoming: 1, ended: 2 };
      const sa = statusOrder[hubEventDisplayStatus(a, now)];
      const sb = statusOrder[hubEventDisplayStatus(b, now)];
      if (sa !== sb) return sa - sb;
      return b.priority - a.priority;
    });
  return sorted[0] ?? null;
}

export function eventPageDescription(def: HubEventDef): string {
  switch (def.kind) {
    case "capture_boost": {
      const cfg = def.config as CaptureBoostEventConfig;
      const bonus = Math.round((cfg.captureBonus ?? 0) * 100);
      const label = cfg.label?.trim();
      return label
        ? label
        : `Bonus capture en run${bonus > 0 ? ` (+${bonus} %)` : ""} — termine des runs pour progresser.`;
    }
    case "gacha_banner": {
      const cfg = def.config as GachaBannerEventConfig;
      const label = cfg.label?.trim();
      return label
        ? label
        : `Bannière gacha limitée${cfg.poolId ? ` (${cfg.poolId})` : ""} — consulte le sanctuaire gacha.`;
    }
    default:
      return "Événement spécial sur Phantoria — consulte les détails et lance une partie si un run est proposé.";
  }
}
