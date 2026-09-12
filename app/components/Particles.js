"use client";

export default function Particles({ count = 18 }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const size = 2 + Math.random() * 4;
    const duration = 8 + Math.random() * 10;
    const delay = Math.random() * 10;
    return { id: i, left, size, duration, delay };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-yellow-100/70 blur-[1px] animate-floatUp"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            bottom: "-10px",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
