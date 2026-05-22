import { Shield } from 'lucide-react'
import { SHIELD_COPY } from '@/lib/security'
import type { ShieldLevel } from '@/types'
import { Card, CardContent } from '@repo/ui/components/card'

export function ShieldBadge({ level }: { level: ShieldLevel }) {
  const info = SHIELD_COPY[level]
  const ring =
    level === 'gold'
      ? 'ring-warning/50'
      : level === 'purple'
        ? 'ring-ai-primary/50'
        : level === 'blue'
          ? 'ring-primary/50'
          : 'ring-border'

  return (
    <Card className={`ring-2 ${ring}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <Shield className={`h-8 w-8 ${info.color}`} />
        <div>
          <p className={`text-sm font-semibold ${info.color}`}>
            Lv.{info.rank} · {info.label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {info.description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
