const GOLD_KEY = "phantoria_gold_local";

export function loadLocalGold(fallback = 1200): number {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(GOLD_KEY);
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function addLocalGold(amount: number): number {
  if (typeof window === "undefined" || amount <= 0) return loadLocalGold();
  const next = loadLocalGold() + amount;
  localStorage.setItem(GOLD_KEY, String(next));
  return next;
}
