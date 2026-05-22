import type { TaskId } from '@/types'

export type TaskTier = 'basic' | 'practical' | 'advanced'

export const TASK_TIER_LABEL: Record<TaskTier, string> = {
  basic: '基础任务',
  practical: '实战任务',
  advanced: '进阶',
}

/** 推荐顺序：8 项活动体验 */
export const TASK_ORDER: TaskId[] = [
  'light_planet',
  'save_key',
  'know_address',
  'first_sign',
  'danger_approve',
  'fake_airdrop',
  'address_poison',
  'security_passport',
]

export const TASK_TIER: Record<TaskId, TaskTier> = {
  light_planet: 'basic',
  save_key: 'basic',
  know_address: 'basic',
  first_sign: 'basic',
  danger_approve: 'practical',
  fake_airdrop: 'practical',
  address_poison: 'practical',
  security_passport: 'advanced',
}

export const TOTAL_TASKS = TASK_ORDER.length

export function normalizeCompletedTasks(tasks: readonly string[]): TaskId[] {
  const set = new Set<string>(tasks)
  if (set.has('shield_quiz')) {
    set.delete('shield_quiz')
    set.add('security_passport')
  }
  return TASK_ORDER.filter((id) => set.has(id))
}

export function countCompleted(tasks: TaskId[]): number {
  return normalizeCompletedTasks(tasks).length
}

export function allTasksDone(tasks: TaskId[]): boolean {
  return countCompleted(tasks) >= TOTAL_TASKS
}

export function nextTaskId(tasks: TaskId[]): TaskId | null {
  const done = new Set(normalizeCompletedTasks(tasks))
  return TASK_ORDER.find((id) => !done.has(id)) ?? null
}
