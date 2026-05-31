const PARTICLES = [
  { left: "12%", top: "18%", delay: "0s", dur: "4s" },
  { left: "78%", top: "12%", delay: "1.2s", dur: "5s" },
  { left: "45%", top: "8%", delay: "0.6s", dur: "6s" },
  { left: "88%", top: "42%", delay: "2s", dur: "4.5s" },
  { left: "22%", top: "55%", delay: "1.8s", dur: "5.5s" },
  { left: "62%", top: "68%", delay: "0.3s", dur: "7s" },
  { left: "8%", top: "72%", delay: "2.5s", dur: "4s" },
  { left: "92%", top: "78%", delay: "1s", dur: "6s" },
  { left: "35%", top: "35%", delay: "3s", dur: "5s" },
  { left: "55%", top: "28%", delay: "1.5s", dur: "4.8s" },
] as const;

export function SceneBackdrop() {
  return (
    <div className="scene" aria-hidden>
      <div className="scene__glow scene__glow--violet" />
      <div className="scene__glow scene__glow--rose" />
      <div className="scene__glow scene__glow--cyan" />
      <div className="scene__floor" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="scene__star"
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
