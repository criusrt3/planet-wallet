/** 经典三卫星公转：标签始终朝向用户（orbit + counter-rotate） */
const SATELLITES = [
  { label: 'ETH', color: '#627EEA', delay: '0s' },
  { label: '安全', color: '#A78BFA', delay: '-2s' },
  { label: '任务', color: '#32CAFA', delay: '-4s' },
] as const

export function PlanetVisualization({ pulse }: { pulse?: boolean }) {
  return (
    <div className="relative mx-auto flex h-56 w-full max-w-xs items-center justify-center">
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(44,146,250,0.5) 0%, transparent 70%)',
        }}
      />
      {SATELLITES.map((s, i) => (
        <div
          key={s.label}
          className="absolute left-1/2 top-1/2 h-2 w-2 -ml-1 -mt-1"
          style={{
            ['--orbit-r' as string]: `${72 + i * 12}px`,
            animation: `orbit ${14 + i * 3}s linear infinite`,
            animationDelay: s.delay,
          }}
        >
          <div
            className="flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-semibold text-white"
            style={{
              background: s.color,
              boxShadow: `0 0 12px ${s.color}`,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
      <div
        className={`planet-core relative z-10 flex h-24 w-24 items-center justify-center rounded-full ${pulse ? 'planet-core-pulse' : ''}`}
        style={{
          background:
            'radial-gradient(circle at 30% 30%, #5eb0ff, #007fff 50%, #004c99)',
        }}
      >
        <span className="text-2xl" aria-hidden>
          🪐
        </span>
      </div>
    </div>
  )
}
