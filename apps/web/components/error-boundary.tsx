"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "@/lib/analytics/posthog-client";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { component_stack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page-stub page-stub--wide" style={{ margin: "2rem auto", maxWidth: "28rem" }}>
          <h1>Oups…</h1>
          <p>Une erreur inattendue est survenue. Recharge la page ou retourne au sanctuaire.</p>
          <p style={{ fontSize: "0.75rem", opacity: 0.7 }}>{this.state.error.message}</p>
          <button
            type="button"
            className="play"
            style={{ marginTop: "1rem" }}
            onClick={() => window.location.assign("/")}
          >
            Sanctuaire
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
