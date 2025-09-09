import React, { useMemo } from 'react';
import './BioluminescentBackground.css';

const NUM_PARTICLES = 60;

const BioluminescentBackground: React.FC = () => {
  const particles = useMemo(() => {
    return new Array(NUM_PARTICLES).fill(null).map((_, idx) => {
      const x = Math.floor(Math.random() * 100);
      const dx = Math.floor(Math.random() * 30) - 15; // drift left/right
      const dur = 10 + Math.random() * 20; // 10-30s
      const delay = Math.random() * -dur; // desync
      const size = Math.random() < 0.2 ? 3 : 2;
      const hue = Math.random() < 0.15 ? 'var(--accent-secondary)' : 'var(--accent-primary)';
      return { idx, x, dx, dur, delay, size, hue };
    });
  }, []);

  return (
    <div className="bio-bg" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.idx}
          className="bio-particle"
          style={{
            left: `${p.x}vw`,
            animationDelay: `${p.delay}s`,
            width: p.size,
            height: p.size,
            background: p.hue,
            '--x': `${p.x}vw`,
            '--dx': `${p.dx}vw`,
            '--dur': `${p.dur}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default BioluminescentBackground;


