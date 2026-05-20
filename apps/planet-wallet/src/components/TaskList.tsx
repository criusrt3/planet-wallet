import { useNavigate } from 'react-router-dom'
import { getTaskHint } from '@/lib/ai-navigator'
import { TASK_META } from '@/lib/storage'
import type { TaskId } from '@/types'
import { ChecklistCard } from '@repo/ui/components/checklist-card'

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
  const navigate = useNavigate()

  function handleTaskClick(id: TaskId, done: boolean) {
    const meta = TASK_META[id]

    if (id === 'save_key') {
      onBackup()
      return
    }
    if (id === 'know_address') {
      onCopyAddress()
      return
    }
    if (id === 'light_planet' && done) {
      navigate('/wallets')
      return
    }

    navigate(meta.route)
  }

  return (
    <ul className="space-y-2">
      {ALL_TASKS.map((id) => {
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
              onClick={() => handleTaskClick(id, done)}
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
  )
}
