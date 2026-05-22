import type { NavigateFunction } from 'react-router-dom'
import { SHIELD_COPY } from '@/lib/security'
import { TASK_META } from '@/lib/storage'
import { taskPath } from '@/lib/task-path'
import { toast } from '@repo/ui/components/toast'
import type { ShieldLevel, TaskId } from '@/types'

/** 链上转账、Swap 等操作最低护盾等级 */
export const MIN_TX_SHIELD_LEVEL = 'purple' as const

const PURPLE_UNLOCK_TASKS: TaskId[] = [
  'first_sign',
  'danger_approve',
  'fake_airdrop',
  'address_poison',
]

/** 紫色护盾及以上（含金色）可进行转账 / 兑换 */
export function canPerformChainOperations(level: ShieldLevel): boolean {
  return SHIELD_COPY[level].rank >= SHIELD_COPY.purple.rank
}

export function suggestPurpleShieldTask(
  completedTasks: TaskId[],
): { path: string; title: string } {
  for (const id of PURPLE_UNLOCK_TASKS) {
    if (!completedTasks.includes(id)) {
      return { path: taskPath(id), title: TASK_META[id].title }
    }
  }
  return { path: '/', title: '新手任务' }
}

/** 护盾未达紫色时引导去做任务 */
export function promptPurpleShieldRequired(
  navigate: NavigateFunction,
  completedTasks: TaskId[],
): void {
  const next = suggestPurpleShieldTask(completedTasks)
  toast.info('需要紫色护盾才能转账与兑换', {
    description: `请先完成任务「${next.title}」，或完成任一实战挑战升级护盾`,
  })
  navigate(next.path, { replace: true })
}
