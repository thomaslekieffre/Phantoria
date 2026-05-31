"use client";

const MOTES = [
  { left: "12%", top: "18%", delay: "0s", dur: "4s", hue: "accent" },
  { left: "78%", top: "12%", delay: "1.2s", dur: "5s", hue: "ember" },
  { left: "45%", top: "8%", delay: "0.6s", dur: "6s", hue: "accent" },
  { left: "88%", top: "42%", delay: "2s", dur: "4.5s", hue: "gold" },
  { left: "22%", top: "55%", delay: "1.8s", dur: "5.5s", hue: "accent" },
  { left: "62%", top: "68%", delay: "0.3s", dur: "7s", hue: "ember" },
  { left: "8%", top: "72%", delay: "2.5s", dur: "4s", hue: "accent" },
  { left: "92%", top: "78%", delay: "1s", dur: "6s", hue: "gold" },
  { left: "35%", top: "35%", delay: "3s", dur: "5s", hue: "ember" },
  { left: "55%", top: "28%", delay: "1.5s", dur: "4.8s", hue: "accent" },
  { left: "70%", top: "48%", delay: "0.8s", dur: "5.2s", hue: "accent" },
  { left: "18%", top: "38%", delay: "2.2s", dur: "6.5s", hue: "ember" },
] as const;

export function SceneBackdrop() {
  return (
    <div className="scene" aria-hidden>
      <div className="scene__moon" />
      <div className="scene__floor" />
      <div className="scene__ripples">
        <span className="scene__ripple" />
        <span className="scene__ripple scene__ripple--mid" />
        <span className="scene__ripple scene__ripple--inner" />
      </div>
      <div className="scene__pool scene__pool--a" />
      <div className="scene__pool scene__pool--b" />
      {MOTES.map((p, i) => (
        <span
          key={i}
          className={`scene__mote scene__mote--${p.hue}`}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}
