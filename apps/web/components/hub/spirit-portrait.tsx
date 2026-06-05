import type { SpiritId } from "./roster";
import { getSpiritMeta, getSpiritPortraitUrl } from "@/lib/player/spirit-catalog";
import "./spirit-portrait.css";

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
  const customUrl = getSpiritPortraitUrl(id);
  if (customUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customUrl}
        alt=""
        className={className ? `spirit-portrait-img ${className}` : "spirit-portrait-img"}
      />
    );
  }

  return <GenericPortrait hue={getSpiritMeta(id)?.hue ?? "#64748b"} className={className} />;
}
