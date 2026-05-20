import { CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getTaskHint } from '@/lib/ai-navigator'
import { TASK_META } from '@/lib/storage'
import type { TaskId } from '@/types'

const ALL_TASKS: TaskId[] = [
  'light_planet',
  'save_key',
  'know_address',
  'first_sign',
  'shield_quiz',
]

export function TaskList({
  completed,
  onBackup,
  onCopyAddress,
}: {
  completed: TaskId[]
  onBackup: () => void
  onCopyAddress: () => void
}) {
  return (
    <ul className="space-y-2">
      {ALL_TASKS.map((id) => {
        const done = completed.includes(id)
        const meta = TASK_META[id]
        const hint = getTaskHint(id, done)

        const row = (
          <div className="glass-card flex items-center gap-3 p-3 transition hover:border-primary/40">
            {done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{meta.title}</p>
              <p className="text-xs text-muted-foreground">{meta.description}</p>
              {!done && (
                <p className="text-xs text-ai-text mt-1">{hint}</p>
              )}
            </div>
          </div>
        )

        if (id === 'save_key' && !done) {
          return (
            <li key={id}>
              <button type="button" className="w-full text-left" onClick={onBackup}>
                {row}
              </button>
            </li>
          )
        }
        if (id === 'know_address' && !done) {
          return (
            <li key={id}>
              <button
                type="button"
                className="w-full text-left"
                onClick={onCopyAddress}
              >
                {row}
              </button>
            </li>
          )
        }
        if (meta.route && !done) {
          return (
            <li key={id}>
              <Link to={meta.route}>{row}</Link>
            </li>
          )
        }
        return <li key={id}>{row}</li>
      })}
    </ul>
  )
}
