import { ChatBubble } from '@repo/ui/components/chat-bubble'
import { Sparkles } from 'lucide-react'

interface AiNavigatorProps {
  message: string
  compact?: boolean
}

export function AiNavigator({ message, compact }: AiNavigatorProps) {
  return (
    <div
      className={`animate-fade-up flex gap-3.5 ${compact ? '' : 'mb-5'}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-surface-blue/40 shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
        <Sparkles className="h-[1.15rem] w-[1.15rem] text-brand-secondary stroke-[1.75]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="text-body-sm font-medium tracking-wide text-brand-secondary">
          链上导航员
        </p>
        <ChatBubble variant="incoming">{message}</ChatBubble>
        <p className="app-meta">
          我不替你做决定，但会在每次风险发生前提醒你。
        </p>
      </div>
    </div>
  )
}
