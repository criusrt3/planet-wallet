import type { AppState, TaskId } from '@/types'

const STORAGE_KEY = 'planet-wallet-state-v1'

export const defaultState: AppState = {
  wallet: null,
  completedTasks: [],
  shieldLevel: 'initial',
  hasViewedBackup: false,
  hasCopiedAddress: false,
  demoSignature: null,
  quizPassed: false,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return { ...defaultState }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearWalletState(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export const TASK_META: Record<
  TaskId,
  { title: string; description: string; route?: string }
> = {
  light_planet: {
    title: '点亮星球',
    description: '创建你的第一个链上钱包',
  },
  save_key: {
    title: '保存钥匙',
    description: '查看并理解助记词备份',
  },
  know_address: {
    title: '认识地址',
    description: '复制你的钱包地址',
  },
  first_sign: {
    title: '第一次签名',
    description: '体验 Demo 消息签名',
    route: '/sign',
  },
  shield_quiz: {
    title: '开启护盾',
    description: '完成安全知识问答',
    route: '/sign',
  },
}
