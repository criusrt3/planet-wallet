import { CircleHelp } from 'lucide-react'
import {
  SHIELD_COPY,
  SHIELD_LEVEL_ORDER,
} from '@/lib/security'
import type { ShieldLevel } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip'

/** 悬停查看护盾四档说明，不占列表空间 */
export function ShieldLevelHint({ currentLevel }: { currentLevel: ShieldLevel }) {
  const current = SHIELD_COPY[currentLevel]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="查看护盾等级说明"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="max-w-[min(300px,90vw)] p-3 text-left bg-popover text-popover-foreground border border-border shadow-lg"
      >
        <p className="text-xs font-semibold mb-2">
          护盾等级 · 当前 Lv.{current.rank} {current.label}
        </p>
        <ul className="space-y-2 text-[10px] leading-relaxed text-muted-foreground">
          {SHIELD_LEVEL_ORDER.map((level) => {
            const meta = SHIELD_COPY[level]
            const isCurrent = level === currentLevel
            return (
              <li
                key={level}
                className={isCurrent ? 'text-foreground font-medium' : ''}
              >
                <span className={meta.color}>
                  Lv.{meta.rank} {meta.label}
                </span>
                {isCurrent ? '（当前）' : ''}
                <br />
                {meta.unlockCondition}
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground border-t border-border pt-2">
          取已满足条件中的最高档；金色需 8/8 任务 + 护照问答。
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
