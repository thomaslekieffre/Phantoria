import posthog from "posthog-js";

let initialized = false;

export function isPostHogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function initPostHog(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
    },
  });
  initialized = true;
}

export function getPostHog() {
  return posthog;
}

export function identifyPlayer(userId: string, props?: Record<string, string | number | boolean | null>) {
  if (!isPostHogEnabled()) return;
  posthog.identify(userId, props);
}

export function resetAnalytics() {
  if (!isPostHogEnabled()) return;
  posthog.reset();
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (!isPostHogEnabled()) return;
  posthog.capture(event, properties);
}

export function trackPageView(path: string) {
  if (!isPostHogEnabled()) return;
  posthog.capture("$pageview", { $current_url: path });
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!isPostHogEnabled()) return;
  posthog.capture("$exception", {
    $exception_message: error.message,
    $exception_type: error.name,
    $exception_stack_trace_raw: error.stack,
    ...context,
  });
}
