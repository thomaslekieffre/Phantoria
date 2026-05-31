"use client";

export type CapturePhase = "flight" | "shake" | "success" | "fail";

type CaptureSequenceProps = {
  targetName: string;
  chancePct: number;
  phase: CapturePhase;
};

function statusText(phase: CapturePhase, name: string): string {
  switch (phase) {
    case "flight":
      return "Lancement de la Phantoball…";
    case "shake":
      return `${name} est aspiré…`;
    case "success":
      return `${name} capturé !`;
    case "fail":
      return `${name} s'échappe !`;
  }
}

export function CaptureSequence({ targetName, chancePct, phase }: CaptureSequenceProps) {
  return (
    <div className="cap-seq" role="status" aria-live="polite">
      <div className="cap-seq__flash" aria-hidden data-phase={phase} />
      <div className={`cap-seq__ball cap-seq__ball--${phase}`} aria-hidden>
        <span className="cap-seq__ball-top" />
        <span className="cap-seq__ball-mid" />
        <span className="cap-seq__ball-bot" />
        <span className="cap-seq__ball-btn" />
      </div>
      <p className={`cap-seq__status cap-seq__status--${phase}`}>{statusText(phase, targetName)}</p>
      {phase === "shake" ? (
        <p className="cap-seq__chance">Chance : {chancePct} %</p>
      ) : null}
      {phase === "fail" ? (
        <p className="cap-seq__hint">L&apos;ennemi reste en combat — réessaie !</p>
      ) : null}
    </div>
  );
}

export type CaptureSeqState = {
  targetId: string;
  targetName: string;
  chancePct: number;
  phase: CapturePhase;
  success: boolean;
};

export const CAPTURE_PHASE_MS: Record<CapturePhase, number> = {
  flight: 650,
  shake: 1500,
  success: 950,
  fail: 1200,
};
