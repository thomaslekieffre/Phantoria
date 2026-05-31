"use client";

export type BattleSpeed = 0 | 1 | 2;

const SPEEDS: { value: BattleSpeed; label: string }[] = [
  { value: 0, label: "⏸" },
  { value: 1, label: "×1" },
  { value: 2, label: "×2" },
];

type BattleSpeedControlsProps = {
  speed: BattleSpeed;
  onChange: (speed: BattleSpeed) => void;
  disabled?: boolean;
};

export function BattleSpeedControls({ speed, onChange, disabled }: BattleSpeedControlsProps) {
  return (
    <div className="battle-speed" role="group" aria-label="Vitesse du combat">
      {SPEEDS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`battle-speed__btn ${speed === value ? "battle-speed__btn--on" : ""}`}
          disabled={disabled}
          aria-pressed={speed === value}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function getTickDelayMs(speed: BattleSpeed, hasActor: boolean): number {
  if (speed === 0) return 0;
  const base = hasActor ? 600 : 50;
  return Math.round(base / speed);
}
