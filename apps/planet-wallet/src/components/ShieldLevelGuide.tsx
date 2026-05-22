import { Shield } from 'lucide-react'
import {
  SHIELD_COPY,
  SHIELD_LEVEL_ORDER,
} from '@/lib/security'
import type { ShieldLevel } from '@/types'
import { Badge } from '@repo/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

export function ShieldLevelGuide({
  currentLevel,
  compact = false,
}: {
  currentLevel: ShieldLevel
  compact?: boolean
}) {
  return (
    <Card className={compact ? 'border-dashed' : ''}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          安全护照 · 护盾等级说明
        </CardTitle>
        {!compact && (
          <p className="text-xs text-muted-foreground font-normal mt-1">
            共 4 档，随新手任务进度自动升级；当前为{' '}
            <span className={SHIELD_COPY[currentLevel].color}>
              {SHIELD_COPY[currentLevel].label}
            </span>
            （Lv.{SHIELD_COPY[currentLevel].rank}）
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {SHIELD_LEVEL_ORDER.map((level) => {
          const meta = SHIELD_COPY[level]
          const isCurrent = level === currentLevel
          return (
            <div
              key={level}
              className={`rounded-lg border p-3 text-sm transition ${
                isCurrent
                  ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-semibold ${meta.color}`}
                >
                  Lv.{meta.rank} · {meta.label}
                </span>
                {isCurrent && (
                  <Badge variant="primary" className="text-[10px]">
                    当前
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-foreground/90">
                {meta.description}
              </p>
              <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-medium text-muted-foreground">
                  升级条件：
                </span>
                {meta.unlockCondition}
              </p>
            </div>
          )
        })}
        <p className="text-[10px] text-muted-foreground pt-1">
          取已满足条件中的最高档；金色护盾需完成全部 8 项任务并通过护照问答。
        </p>
      </CardContent>
    </Card>
  )
}
