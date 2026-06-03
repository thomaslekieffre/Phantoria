import type { SpiritId } from "./roster";
import { getSpiritMeta } from "@/lib/player/spirit-catalog";

type SpiritPortraitProps = {
  id: SpiritId;
  className?: string;
};

function GenericPortrait({ hue, className }: { hue: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 72" aria-hidden>
      <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
      <path
        d="M18 44c-2-16 10-28 22-28s26 12 24 28c-2 10-10 18-20 18-6 0-12-4-14-10-8 2-14-4-12-8z"
        fill={hue}
      />
      <circle cx="26" cy="40" r="4.5" fill="#fff" />
      <circle cx="42" cy="40" r="4.5" fill="#fff" />
      <circle cx="27" cy="41" r="1.8" fill="#0f172a" />
      <circle cx="43" cy="41" r="1.8" fill="#0f172a" />
      <path d="M28 48q4 3 8 0" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function SpiritPortrait({ id, className }: SpiritPortraitProps) {
  if (id === "bram") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M14 42c-2-16 10-28 22-30s24 12 22 28c-1 10-8 18-18 20-6 1-12-2-16-8-6 4-12 2-12-10z" fill="#f97316" />
        <path d="M10 28c-5-4-3-14 5-16 7-2 11 4 9 12-2 9-11 11-14 4z" fill="#ea580c" />
        <path d="M54 28c5-4 3-14-5-16-7-2-11 4-9 12 2 9 11 11 14 4z" fill="#ea580c" />
        <circle cx="24" cy="38" r="4.5" fill="#fff" />
        <circle cx="40" cy="38" r="4.5" fill="#fff" />
        <circle cx="25" cy="39" r="2" fill="#1c1917" />
        <circle cx="41" cy="39" r="2" fill="#1c1917" />
        <path d="M28 48q4 3 8 0" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M42 22c6-5 12-2 14 5" stroke="#fdba74" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "nyx") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M16 44c0-18 12-30 26-28 13 2 20 14 18 28-2 12-10 20-20 18-8-1-14-6-16-12-8 2-14-4-8-6z" fill="#1e1b4b" />
        <circle cx="25" cy="40" r="4.5" fill="#67e8f9" />
        <circle cx="41" cy="40" r="4.5" fill="#67e8f9" />
        <circle cx="26" cy="41" r="1.8" fill="#0c4a6e" />
        <circle cx="42" cy="41" r="1.8" fill="#0c4a6e" />
        <path d="M40 26c5-7 12-3 14 4" fill="#38bdf8" opacity="0.9" />
      </svg>
    );
  }

  if (id === "luma") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M18 44c-2-16 10-28 22-28s26 12 24 28c-2 10-10 18-20 18-6 0-12-4-14-10-8 2-14-4-12-8z" fill="#fdf2f8" />
        <circle cx="26" cy="40" r="4.5" fill="#38bdf8" />
        <circle cx="42" cy="40" r="4.5" fill="#38bdf8" />
        <circle cx="27" cy="41" r="1.8" fill="#0c4a6e" />
        <circle cx="43" cy="41" r="1.8" fill="#0c4a6e" />
        <path d="M44 24c5-8 12-4 14 2" fill="#7dd3fc" />
      </svg>
    );
  }

  if (id === "kiro") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M20 44c2-16 14-28 26-26 12 2 18 14 16 26-2 10-10 18-18 16-6-2-10-6-12-10-8 3-14-2-12-6z" fill="#164e63" />
        <circle cx="26" cy="40" r="4.5" fill="#fef08a" />
        <circle cx="42" cy="40" r="4.5" fill="#fef08a" />
        <circle cx="27" cy="41" r="1.8" fill="#422006" />
        <circle cx="43" cy="41" r="1.8" fill="#422006" />
        <path d="M24 50q8 4 16 0" stroke="#0891b2" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M38 22l8 6-4 8" stroke="#22d3ee" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "roche") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M16 42c0-14 10-26 24-26s26 12 22 26c-2 12-10 20-20 18-8-2-14-8-16-14-8 2-14-4-10-4z" fill="#78716c" />
        <circle cx="26" cy="40" r="4" fill="#e7e5e4" />
        <circle cx="42" cy="40" r="4" fill="#e7e5e4" />
        <circle cx="27" cy="41" r="1.6" fill="#292524" />
        <circle cx="43" cy="41" r="1.6" fill="#292524" />
        <path d="M28 48q4 2 8 0" stroke="#44403c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "halo") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M18 44c-2-16 10-28 22-28s26 12 24 28c-2 10-10 18-20 18-6 0-12-4-14-10-8 2-14-4-12-8z" fill="#fef3c7" />
        <circle cx="26" cy="40" r="4.5" fill="#fff" />
        <circle cx="42" cy="40" r="4.5" fill="#fff" />
        <circle cx="27" cy="41" r="1.8" fill="#713f12" />
        <circle cx="43" cy="41" r="1.8" fill="#713f12" />
        <path d="M32 18l6 10h-12l6-10z" fill="#fbbf24" opacity="0.9" />
        <path d="M28 48q4 3 8 0" stroke="#a16207" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  return <GenericPortrait hue={getSpiritMeta(id)?.hue ?? "#64748b"} className={className} />;
}
