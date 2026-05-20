import { ChatBubble } from '@repo/ui/components/chat-bubble'
import { Sparkles } from 'lucide-react'

interface AiNavigatorProps {
  message: string
  compact?: boolean
}

export function AiNavigator({ message, compact }: AiNavigatorProps) {
  return (
    <div
      className={`animate-fade-up flex gap-3 ${compact ? '' : 'mb-4'}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ai-subtle-bg border border-ai-subtle-border">
        <Sparkles className="h-5 w-5 text-ai-icon" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-medium text-ai-text">链上导航员</p>
        <ChatBubble variant="incoming">{message}</ChatBubble>
        <p className="text-xs text-muted-foreground">
          我不替你做决定，但会在每次风险发生前提醒你。
        </p>
      </div>
    </div>
  )
}
