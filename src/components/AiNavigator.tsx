import { Sparkles } from 'lucide-react'

interface AiNavigatorProps {
  message: string
  compact?: boolean
}

export function AiNavigator({ message, compact }: AiNavigatorProps) {
  return (
    <div
      className={`glass-card animate-fade-up flex gap-3 p-4 ${compact ? '' : 'mb-4'}`}
      style={{ borderColor: 'rgba(167, 139, 250, 0.35)' }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--ai-subtle-bg)' }}
      >
        <Sparkles className="h-5 w-5 text-ai-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ai-text mb-1">链上导航员</p>
        <p className="text-sm leading-relaxed text-foreground/90">{message}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          我不替你做决定，但会在每次风险发生前提醒你。
        </p>
      </div>
    </div>
  )
}
