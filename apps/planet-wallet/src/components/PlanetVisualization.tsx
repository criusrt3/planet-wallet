/** 经典三卫星公转：标签始终朝向用户（orbit + counter-rotate） */
const SATELLITES = [
  { label: 'ETH', color: '#627EEA' },
  { label: '安全', color: 'var(--ai-primary)' },
  { label: '任务', color: 'var(--brand-secondary)' },
] as const

export function PlanetVisualization({ pulse }: { pulse?: boolean }) {
  return (
    <div className="relative mx-auto flex h-56 w-full max-w-xs items-center justify-center">
      <div className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-3xl planet-scene-glow" />
      {SATELLITES.map((s, i) => (
        <div
          key={s.label}
          className="absolute left-1/2 top-1/2 h-2 w-2 -ml-1 -mt-1"
          style={{
            ['--orbit-r' as string]: `${72 + i * 12}px`,
            animation: `orbit ${14 + i * 3}s linear infinite`,
            animationDelay: `${-i * 2}s`,
          }}
        >
          <div
            className="planet-satellite flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-[var(--shadow-cta-sm)]"
            style={{
              background: s.color,
              boxShadow: `0 0 14px color-mix(in srgb, ${s.color} 65%, transparent)`,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
      <div
        className={`planet-core planet-core-surface relative z-10 flex h-24 w-24 items-center justify-center rounded-full ${pulse ? 'planet-core-pulse' : ''}`}
      >
        <span className="text-2xl drop-shadow-sm" aria-hidden>
          🪐
        </span>
      </div>
    </div>
  )
}
