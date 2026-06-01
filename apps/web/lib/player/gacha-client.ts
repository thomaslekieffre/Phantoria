import type { GachaPullResult, StandardPullPayment } from "./gacha-service";
import { STANDARD_MULTI_PULL_COUNT } from "./gacha-pool";

type WelcomeResponse = {
  results: GachaPullResult[];
  welcomePullsRemaining: number;
  error?: string;
};

type StandardResponse = {
  results: GachaPullResult[];
  gachaPityStandard: number;
  error?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export async function pullWelcomeGacha(all = false): Promise<WelcomeResponse> {
  const res = await fetch("/api/gacha/welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all }),
  });
  if (!res.ok) {
    const body = await parseJson<WelcomeResponse>(res).catch(() => ({} as WelcomeResponse));
    return {
      results: [],
      welcomePullsRemaining: 0,
      error: body.error ?? "Invocation impossible",
    };
  }
  return parseJson<WelcomeResponse>(res);
}

export async function pullStandardGacha(
  payment: StandardPullPayment,
  count: 1 | typeof STANDARD_MULTI_PULL_COUNT,
): Promise<StandardResponse> {
  const res = await fetch("/api/gacha/standard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment, count }),
  });
  if (!res.ok) {
    const body = await parseJson<StandardResponse>(res).catch(() => ({} as StandardResponse));
    return {
      results: [],
      gachaPityStandard: 0,
      error: body.error ?? "Invocation impossible",
    };
  }
  return parseJson<StandardResponse>(res);
}
