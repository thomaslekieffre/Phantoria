import { captureEvent } from "./posthog-client";

export function trackPageView(path: string) {
  captureEvent("$pageview", { path });
}

export function trackRunStarted(starterKey: string) {
  captureEvent("run_started", { starter_key: starterKey });
}

export function trackRunEnded(props: {
  wave: number;
  outcome: "won" | "lost";
  relicsCount: number;
  runGold: number;
  ticketsEarned?: number;
  gemsEarned?: number;
}) {
  captureEvent("run_ended", props);
}

export function trackWaveCleared(props: { wave: number; waveKind: string; runGold: number }) {
  captureEvent("wave_cleared", props);
}

export function trackCaptureAttempt(props: {
  enemyKey: string;
  ball: string;
  success: boolean;
  wave: number;
  hpRatio: number;
}) {
  captureEvent(props.success ? "capture_success" : "capture_attempt", props);
}

export function trackGachaPull(props: {
  pool: "welcome" | "standard";
  payment?: "ticket" | "gems" | "free";
  count: number;
  results: { hubId: string; rarity: string; templateKey: string }[];
}) {
  captureEvent("gacha_pull", {
    pool: props.pool,
    payment: props.payment ?? "free",
    count: props.count,
    top_rarity: props.results[0]?.rarity,
    spirits: props.results.map((r) => r.hubId),
  });
}

export function trackStoryLevelStarted(props: { levelId: string; zoneId: number; index: number }) {
  captureEvent("story_level_started", props);
}

export function trackStoryLevelCompleted(props: {
  levelId: string;
  zoneId: number;
  index: number;
  stars: number;
  firstClear: boolean;
  goldEarned: number;
}) {
  captureEvent("story_level_completed", props);
}
