import type { CSSProperties } from "react";

const SPIRITS = [
  { name: "Bram", tribe: "Vaillants", color: "#ea580c", glow: "#fb923c", hp: 100, field: true },
  { name: "Nyx", tribe: "Mystérieux", color: "#9333ea", glow: "#c084fc", hp: 72, field: true },
  { name: "Luma", tribe: "Mignons", color: "#db2777", glow: "#f9a8d4", hp: 100, field: true },
  { name: "???", tribe: "Réserve", color: "#475569", glow: "#64748b", hp: 0, field: false, empty: true },
] as const;

export function TeamStrip() {
  return (
    <div className="team-strip">
      <div className="team-strip__header">
        <span className="team-strip__label">Équipe</span>
        <span className="team-strip__count">3 / 6 · 3 sur le terrain</span>
      </div>
      <div className="team-strip__scroll">
        {SPIRITS.map((s) => (
          <button
            key={s.name}
            type="button"
            className={`spirit-card ${s.field ? "spirit-card--field" : ""} ${"empty" in s && s.empty ? "spirit-card--empty" : ""}`}
            style={{ "--c": s.color, "--g": s.glow } as CSSProperties}
            disabled={"empty" in s && s.empty}
          >
            <div className="spirit-card__frame">
              <div className="spirit-card__avatar">
                {!("empty" in s && s.empty) ? (
                  <span className="spirit-card__initial">
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <span className="spirit-card__plus">+</span>
                )}
              </div>
              {s.field ? <span className="spirit-card__badge">Terrain</span> : null}
            </div>
            <span className="spirit-card__name">{s.name}</span>
            <span className="spirit-card__tribe">{s.tribe}</span>
            {s.hp > 0 ? (
              <div className="spirit-card__hp">
                <div className="spirit-card__hp-fill" style={{ width: `${s.hp}%` }} />
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
