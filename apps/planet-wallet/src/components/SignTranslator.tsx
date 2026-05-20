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
      <p className="text-xs text-muted-foreground whitespace-pre-line">
        {analysis.detail}
      </p>
      {analysis.irreversible && (
        <p className="text-xs text-warning-text">
          此类型操作可能无法撤回，请谨慎确认。
        </p>
      )}
    </div>
  )
}
