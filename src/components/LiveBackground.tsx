import { useMemo } from 'react';

export default function LiveBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 20,
        size: 2 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    []
  );

  return (
    <div className="live-bg" aria-hidden="true">
      <div className="live-bg-orb live-bg-orb--blue" />
      <div className="live-bg-orb live-bg-orb--cyan" />
      <div className="live-bg-orb live-bg-orb--violet" />
      <div className="live-bg-grid" />
      <div className="live-bg-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="live-bg-particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
