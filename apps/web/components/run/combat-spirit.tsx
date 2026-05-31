import { SpiritPortrait } from "@/components/hub/spirit-portrait";
import { isSpiritId, type SpiritId } from "@/components/hub/roster";
import { CORE_HUE, CORE_TO_HUB } from "@/components/run/wheel-map";

type CombatSpiritProps = {
  templateKey: string;
  name: string;
  className?: string;
};

function EnemySpiritSvg({ templateKey, className }: { templateKey: string; className?: string }) {
  const hue = CORE_HUE[templateKey] ?? "#6366f1";

  if (templateKey === "ombre_faible") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M18 46c-2-18 12-32 26-30 14 2 22 16 18 32-3 12-12 20-22 18-8-1-14-8-16-14-8 3-14-2-6-6z" fill={hue} />
        <circle cx="26" cy="40" r="4" fill="#c4b5fd" />
        <circle cx="42" cy="40" r="4" fill="#c4b5fd" />
        <circle cx="27" cy="41" r="1.6" fill="#1e1b4b" />
        <circle cx="43" cy="41" r="1.6" fill="#1e1b4b" />
        <path d="M30 50q4 2 8 0" stroke="#312e81" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M14 30c-4-6 0-14 8-12" stroke="#4338ca" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }

  if (templateKey === "neant_scout") {
    return (
      <svg className={className} viewBox="0 0 64 72" aria-hidden>
        <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
        <path d="M20 44c0-16 10-28 24-26 12 2 20 12 18 26-2 10-10 18-20 16-6-1-12-6-14-12-8 2-14-4-8-4z" fill={hue} />
        <circle cx="26" cy="40" r="4" fill="#5eead4" />
        <circle cx="42" cy="40" r="4" fill="#5eead4" />
        <circle cx="27" cy="41" r="1.6" fill="#042f2e" />
        <circle cx="43" cy="41" r="1.6" fill="#042f2e" />
        <path d="M28 24l8-10 8 10" stroke="#134e4a" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M24 52h16" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 64 72" aria-hidden>
      <ellipse cx="32" cy="62" rx="18" ry="5" fill="rgba(0,0,0,0.3)" />
      <path d="M18 44c-2-16 10-28 22-28s26 12 24 28c-2 10-10 18-20 18-6 0-12-4-14-10-8 2-14-4-12-8z" fill={hue} />
      <circle cx="26" cy="40" r="4" fill="#fff" />
      <circle cx="42" cy="40" r="4" fill="#fff" />
      <circle cx="27" cy="41" r="1.6" fill="#0f172a" />
      <circle cx="43" cy="41" r="1.6" fill="#0f172a" />
    </svg>
  );
}

export function CombatSpirit({ templateKey, name, className }: CombatSpiritProps) {
  const hubId = CORE_TO_HUB[templateKey];
  if (hubId && isSpiritId(hubId)) {
    return <SpiritPortrait id={hubId as SpiritId} className={className} />;
  }
  return <EnemySpiritSvg templateKey={templateKey} className={className} />;
}

export function combatSpiritHue(templateKey: string): string {
  return CORE_HUE[templateKey] ?? "#6366f1";
}
