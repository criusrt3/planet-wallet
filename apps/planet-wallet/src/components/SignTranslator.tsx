import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import type { SignAnalysis } from '@/types'

const RISK_STYLES = {
  info: {
    icon: Info,
    className: 'border-info-border bg-info-surface',
    label: '信息',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning-border bg-warning-surface',
    label: '注意',
  },
  danger: {
    icon: ShieldAlert,
    className: 'border-danger-border bg-error-surface',
    label: '高风险',
  },
  block: {
    icon: ShieldAlert,
    className: 'border-destructive bg-error-surface',
    label: '已拦截',
  },
}

export function SignTranslator({ analysis }: { analysis: SignAnalysis }) {
  const style = RISK_STYLES[analysis.riskLevel]
  const Icon = style.icon

  return (
    <div className="space-y-3 animate-fade-up">
      <Alert className={style.className}>
        <Icon className="h-4 w-4" />
        <AlertTitle>
          {style.label} · {analysis.title}
        </AlertTitle>
        <AlertDescription className="text-foreground font-medium">
          {analysis.aiTranslation}
        </AlertDescription>
      </Alert>
      {analysis.detail ? (
        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
          {analysis.detail}
        </p>
      ) : null}
      {analysis.skillRef && (
        <p className="text-[10px] text-muted-foreground border-t border-border/60 pt-2">
          Security Skill · {analysis.skillRef}
        </p>
      )}
      {!analysis.canProceed && (
        <p className="text-xs font-medium text-destructive">
          建议拒绝本次操作，查证后再决定。
        </p>
      )}
    </div>
  )
}
