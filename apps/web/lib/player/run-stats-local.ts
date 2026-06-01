const RUNS_KEY = "phantoria_runs_completed";

export function getLocalRunsCompleted(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(RUNS_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementLocalRunsCompleted(): number {
  const next = getLocalRunsCompleted() + 1;
  if (typeof window !== "undefined") {
    localStorage.setItem(RUNS_KEY, String(next));
  }
  return next;
}
