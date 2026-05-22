import { getNavigatorMessage } from '@/lib/ai-navigator'
import { SHIELD_COPY } from '@/lib/security'
import { TASK_META } from '@/lib/storage'
import {
  countCompleted,
  nextTaskId,
  TASK_ORDER,
  TOTAL_TASKS,
} from '@/lib/tasks'
import type { ShieldLevel, TaskId } from '@/types'

export type PlanetBubbleId = 'core' | 'eth' | 'security' | 'tasks' | 'assets'

export type PlanetBubbleVariant = 'info' | 'warning' | 'success'

export interface PlanetBubbleTip {
  id: PlanetBubbleId
  title: string
  body: string
  variant: PlanetBubbleVariant
  taskId?: TaskId
  ctaLabel?: string
  /** 优先于 taskPath(taskId) */
  href?: string
}

const LANE_TO_BUBBLE: Record<string, PlanetBubbleId> = {
  ETH: 'eth',
  安全: 'security',
  任务: 'tasks',
  资产: 'assets',
}

export function laneLabelToBubbleId(label: string): PlanetBubbleId | null {
  return LANE_TO_BUBBLE[label] ?? null
}

function isDone(completed: TaskId[], id: TaskId) {
  return completed.includes(id)
}

function tipForTask(id: TaskId, completed: TaskId[]): PlanetBubbleTip {
  const done = isDone(completed, id)
  const meta = TASK_META[id]
  const sceneMap: Partial<Record<TaskId, string>> = {
    save_key: 'backup',
    know_address: 'address',
    first_sign: 'sign_intro',
    danger_approve: 'challenge_approve',
    fake_airdrop: 'challenge_airdrop',
    address_poison: 'challenge_poison',
    security_passport: 'passport',
  }
  const scene = sceneMap[id]
  const body = scene
    ? getNavigatorMessage(scene).text
    : meta.description

  return {
    id: 'tasks',
    title: done ? `✓ ${meta.title}` : meta.title,
    body,
    variant: done ? 'success' : 'warning',
    taskId: id,
    ctaLabel: done ? meta.reviewLabel ?? '再练一次' : '去完成',
  }
}

/** 点击星球周围空白处：从任务相关安全文案中随机一条 */
export function pickRandomPlanetTip(ctx: {
  completedTasks: TaskId[]
  shieldLevel: ShieldLevel
}): PlanetBubbleTip {
  const { completedTasks } = ctx
  const pool: PlanetBubbleTip[] = [
    {
      id: 'security',
      title: '保存钥匙',
      body: getNavigatorMessage('backup').text,
      variant: isDone(completedTasks, 'save_key') ? 'success' : 'warning',
      taskId: 'save_key',
    },
    {
      id: 'security',
      title: '认识地址',
      body: getNavigatorMessage('address').text,
      variant: isDone(completedTasks, 'know_address') ? 'success' : 'warning',
      taskId: 'know_address',
    },
    {
      id: 'security',
      title: '第一次签名',
      body: getNavigatorMessage('sign_intro').text,
      variant: isDone(completedTasks, 'first_sign') ? 'success' : 'info',
      taskId: 'first_sign',
    },
    {
      id: 'security',
      title: '危险授权',
      body: getNavigatorMessage('challenge_approve').text,
      variant: isDone(completedTasks, 'danger_approve') ? 'success' : 'warning',
      taskId: 'danger_approve',
    },
    {
      id: 'security',
      title: '假空投识别',
      body: getNavigatorMessage('challenge_airdrop').text,
      variant: isDone(completedTasks, 'fake_airdrop') ? 'success' : 'warning',
      taskId: 'fake_airdrop',
    },
    {
      id: 'security',
      title: '地址投毒',
      body: getNavigatorMessage('challenge_poison').text,
      variant: isDone(completedTasks, 'address_poison') ? 'success' : 'warning',
      taskId: 'address_poison',
    },
    {
      id: 'tasks',
      title: '高风险操作',
      body: getNavigatorMessage('high_risk').text,
      variant: 'warning',
      taskId: 'danger_approve',
    },
    {
      id: 'tasks',
      title: TASK_META.light_planet.title,
      body: getNavigatorMessage('create_done').text,
      variant: isDone(completedTasks, 'light_planet') ? 'success' : 'info',
      taskId: 'light_planet',
    },
    {
      id: 'tasks',
      title: TASK_META.security_passport.title,
      body: getNavigatorMessage('quiz_intro').text,
      variant: isDone(completedTasks, 'security_passport') ? 'success' : 'info',
      taskId: 'security_passport',
    },
  ]

  const pending = TASK_ORDER.filter((t) => !isDone(completedTasks, t))
  const weighted: PlanetBubbleTip[] = []
  for (const tip of pool) {
    const related = tip.taskId && pending.includes(tip.taskId)
    weighted.push(tip, ...(related ? [tip, tip] : []))
  }

  const pick = weighted[Math.floor(Math.random() * weighted.length)] ?? pool[0]!
  return {
    ...pick,
    title: `随机锦囊 · ${pick.title}`,
  }
}

export function getPlanetBubbleTip(
  id: PlanetBubbleId,
  ctx: { completedTasks: TaskId[]; shieldLevel: ShieldLevel },
): PlanetBubbleTip {
  const { completedTasks, shieldLevel } = ctx
  const shield = SHIELD_COPY[shieldLevel]
  const doneCount = countCompleted(completedTasks)
  const next = nextTaskId(completedTasks)

  switch (id) {
    case 'core': {
      const nextLine = next
        ? `建议下一步：${TASK_META[next].title} — ${TASK_META[next].description}`
        : '新手任务已全部完成，继续保持警惕。'
      return {
        id: 'core',
        title: shield.label,
        body: `${shield.description} ${nextLine}`,
        variant: shieldLevel === 'gold' ? 'success' : 'info',
        taskId: next ?? undefined,
        ctaLabel: next ? '去做任务' : undefined,
      }
    }
    case 'eth': {
      const addrDone = isDone(completedTasks, 'know_address')
      return {
        id: 'eth',
        title: '链上转账 · 地址',
        body: addrDone
          ? `${getNavigatorMessage('address').text} 转账前请核对完整 0x 地址与 Sepolia Gas。`
          : `${getNavigatorMessage('address').text} 完成「认识地址」任务，养成复制后核对的习惯。`,
        variant: addrDone ? 'info' : 'warning',
        taskId: addrDone ? undefined : 'know_address',
        ctaLabel: addrDone ? '去转账' : '认识地址',
        href: addrDone ? '/transfer' : undefined,
      }
    }
    case 'security': {
      const pick = (
        [
          'save_key',
          'first_sign',
          'danger_approve',
          'fake_airdrop',
          'address_poison',
        ] as TaskId[]
      ).find((t) => !isDone(completedTasks, t)) ?? 'save_key'
      const t = tipForTask(pick, completedTasks)
      return { ...t, id: 'security', title: `安全护盾 · ${t.title}` }
    }
    case 'tasks': {
      const pending = TASK_ORDER.filter((t) => !isDone(completedTasks, t))
      if (pending.length === 0) {
        return {
          id: 'tasks',
          title: '新手任务 · 已全部完成',
          body: getNavigatorMessage('passport').text,
          variant: 'success',
          taskId: 'security_passport',
          ctaLabel: '查看护照',
        }
      }
      const pick = pending[0]!
      const t = tipForTask(pick, completedTasks)
      return {
        ...t,
        id: 'tasks',
        title: `任务进度 ${doneCount}/${TOTAL_TASKS}`,
        body: `${t.body} 还有 ${pending.length} 项可继续完成。`,
      }
    }
    case 'assets': {
      const approveDone = isDone(completedTasks, 'danger_approve')
      return {
        id: 'assets',
        title: '资产与兑换',
        body: approveDone
          ? 'Swap 需先授权路由器，只授权本次额度更安全。测试网请用小额度练手。'
          : `${getNavigatorMessage('challenge_approve').text} 兑换前弄清 Approve 与 Swap 是两步。`,
        variant: approveDone ? 'info' : 'warning',
        taskId: approveDone ? undefined : 'danger_approve',
        ctaLabel: approveDone ? '去兑换' : '练授权识别',
        href: approveDone ? '/swap' : undefined,
      }
    }
  }
}
