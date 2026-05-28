export function CampBackdrop() {
  return (
    <div className="camp-backdrop" aria-hidden>
      <div className="camp-backdrop__sky" />
      <svg className="camp-backdrop__stars" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        {[...Array(40)].map((_, i) => (
          <circle
            key={i}
            cx={(i * 47) % 400}
            cy={(i * 31) % 180}
            r={i % 3 === 0 ? 1.2 : 0.6}
            fill="white"
            opacity={0.2 + (i % 5) * 0.12}
          />
        ))}
      </svg>
      <div className="camp-backdrop__moon" />
      <div className="camp-backdrop__hills" />
      <div className="camp-backdrop__ground" />
      <div className="camp-backdrop__fire">
        <span className="camp-backdrop__fire-core" />
        <span className="camp-backdrop__fire-glow" />
      </div>
      <div className="camp-backdrop__vignette" />
    </div>
  );
}
