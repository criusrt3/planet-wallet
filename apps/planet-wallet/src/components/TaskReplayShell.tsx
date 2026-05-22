import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

export function TaskReplayShell({
  title,
  done,
  onReplay,
  children,
}: {
  title: string
  done: boolean
  onReplay?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-title-sm font-bold">{title}</h2>
        {done && (
          <Badge variant="primary" className="text-[10px]">
            已完成 · 可重复体验
          </Badge>
        )}
      </div>
      {children}
      {onReplay && (
        <Button type="button" variant="outline" className="w-full" onClick={onReplay}>
          <RotateCcw className="mr-2 h-4 w-4" />
          再次体验（重置本关）
        </Button>
      )}
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/">返回任务列表</Link>
      </Button>
    </div>
  )
}
