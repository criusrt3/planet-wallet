import { Shield } from 'lucide-react'
import type { ShieldPulse } from '@/types'
import { Alert, AlertDescription } from '@repo/ui/components/alert'

const PULSE_STYLE: Record<
  ShieldPulse['level'],
  string
> = {
  info: 'border-info-border bg-info-surface',
  warning: 'border-warning-border bg-warning-surface',
  danger: 'border-danger-border bg-error-surface',
  block: 'border-destructive bg-error-surface',
}

export function ShieldStatusBar({ pulse }: { pulse: ShieldPulse | null }) {
  if (!pulse) return null

  return (
    <Alert className={PULSE_STYLE[pulse.level]}>
      <Shield className="h-4 w-4" />
      <AlertDescription className="text-xs space-y-1">
        <p className="font-medium text-foreground">{pulse.message}</p>
        {pulse.skillRef && (
          <p className="text-muted-foreground">{pulse.skillRef}</p>
        )}
      </AlertDescription>
    </Alert>
  )
}
