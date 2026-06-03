"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { getPostHog, initPostHog, isPostHogEnabled, trackPageView } from "@/lib/analytics/posthog-client";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    trackPageView(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!isPostHogEnabled()) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={getPostHog()}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
