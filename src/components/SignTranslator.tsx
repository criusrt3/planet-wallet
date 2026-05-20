import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import type { SignAnalysis } from '@/types'

const RISK_STYLES = {
  info: {
    icon: Info,
    bar: 'border-info/40 bg-info/10 text-foreground',
    label: '信息',
  },
  warning: {
    icon: AlertTriangle,
    bar: 'border-warning/40 bg-warning/10 text-warning',
    label: '注意',
  },
  danger: {
    icon: ShieldAlert,
    bar: 'border-destructive/40 bg-destructive/10 text-destructive',
    label: '高风险',
  },
  block: {
    icon: ShieldAlert,
    bar: 'border-destructive bg-destructive/20 text-destructive',
    label: '已拦截',
  },
}

export function SignTranslator({ analysis }: { analysis: SignAnalysis }) {
  const style = RISK_STYLES[analysis.riskLevel]
  const Icon = style.icon

  return (
    <div className="space-y-3 animate-fade-up">
      <div className={`rounded-xl border p-4 ${style.bar}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {style.label} · {analysis.title}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed">
          {analysis.aiTranslation}
        </p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-pre-line">
        {analysis.detail}
      </p>
      {analysis.irreversible && (
        <p className="text-xs text-warning">
          ⚠ 此类型操作可能无法撤回，请谨慎确认。
        </p>
      )}
    </div>
  )
}
