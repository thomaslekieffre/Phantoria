import type { Rarity } from "@phantoria/game-core";
import { RARITY_LABEL } from "@/lib/spirit-rarity";
import "./rarity-badge.css";

type RarityBadgeProps = {
  rarity: Rarity;
  size?: "xs" | "sm" | "md";
  className?: string;
  title?: string;
};

export function RarityBadge({ rarity, size = "sm", className = "", title }: RarityBadgeProps) {
  const label = RARITY_LABEL[rarity];
  return (
    <span
      className={`rarity-badge rarity-badge--${rarity.toLowerCase()} rarity-badge--${size} ${className}`.trim()}
      title={title ?? `Rareté ${label}`}
      aria-label={`Rareté ${label}`}
    >
      {label}
    </span>
  );
}
