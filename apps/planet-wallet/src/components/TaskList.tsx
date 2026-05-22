import { useNavigate } from 'react-router-dom'
import { getTaskHint } from '@/lib/ai-navigator'
import { taskPath } from '@/lib/task-path'
import { TASK_META } from '@/lib/storage'
import {
  TASK_ORDER,
  TASK_TIER,
  TASK_TIER_LABEL,
  type TaskTier,
} from '@/lib/tasks'
import type { TaskId } from '@/types'
import { ChecklistCard } from '@repo/ui/components/checklist-card'

const TIER_ORDER: TaskTier[] = ['basic', 'practical', 'advanced']

export function TaskList({ completed }: { completed: TaskId[] }) {
  const navigate = useNavigate()

  function handleTaskClick(id: TaskId) {
    navigate(taskPath(id))
  }

  return (
    <div className="space-y-5">
      {TIER_ORDER.map((tier) => {
        const ids = TASK_ORDER.filter((id) => TASK_TIER[id] === tier)
        return (
          <div key={tier} className="flex flex-col gap-3">
            <p className="app-label-caps">
              {TASK_TIER_LABEL[tier]}
            </p>
            <ul className="flex flex-col gap-2.5">
              {ids.map((id) => {
                const done = completed.includes(id)
                const meta = TASK_META[id]
                const hint = getTaskHint(id, done)
                const tone = done ? 'success' : 'neutral'
                const description = done
                  ? `${meta.reviewLabel ?? '点击查看'} · ${hint}`
                  : `${meta.description} · ${hint}`

                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => handleTaskClick(id)}
                    >
                      <ChecklistCard
                        title={meta.title}
                        description={description}
                        tone={tone}
                        className="w-full text-left transition hover:border-primary/40"
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
