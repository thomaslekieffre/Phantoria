import type { Metadata, Viewport } from "next";
import { Nunito, Outfit } from "next/font/google";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/error-boundary";
import { AudioProvider } from "@/components/providers/audio-provider";
import { GameContentProvider } from "@/components/providers/game-content-provider";
import { PlayerProvider } from "@/components/providers/player-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PageEnter } from "@/components/ui/page-enter";
import "./globals.css";
import "./responsive.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Phantoria",
  description: "Gacha roguelite — jeu web dans le navigateur",
  applicationName: "Phantoria",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060d0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${nunito.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full antialiased">
        <AppErrorBoundary>
          <PostHogProvider>
            <AudioProvider>
              <ToastProvider>
                <GameContentProvider>
                  <Suspense fallback={null}>
                    <PlayerProvider>
                      <PageEnter>{children}</PageEnter>
                    </PlayerProvider>
                  </Suspense>
                </GameContentProvider>
              </ToastProvider>
            </AudioProvider>
          </PostHogProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
