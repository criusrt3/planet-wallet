import { Shield } from 'lucide-react'
import { SHIELD_COPY } from '@/lib/security'
import type { ShieldLevel } from '@/types'

export function ShieldBadge({ level }: { level: ShieldLevel }) {
  const info = SHIELD_COPY[level]
  const ring =
    level === 'gold'
      ? 'ring-warning/60'
      : level === 'purple'
        ? 'ring-ai-primary/60'
        : level === 'blue'
          ? 'ring-primary/60'
          : 'ring-border'

  return (
    <div className={`glass-card flex items-center gap-3 p-3 ring-2 ${ring}`}>
      <Shield className={`h-8 w-8 ${info.color}`} />
      <div>
        <p className={`text-sm font-semibold ${info.color}`}>{info.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
      </div>
    </div>
  )
}
