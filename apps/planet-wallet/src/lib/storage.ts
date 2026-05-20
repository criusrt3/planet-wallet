import type { AppState, TaskId, WalletIdentity } from '@/types'

export const STORAGE_KEY = 'planet-wallet-state-v5'
export const MAX_WALLETS = 10

export const defaultState: AppState = {
  wallets: [],
  activeWalletId: null,
  addressBook: [],
  txHistory: [],
  settings: { showLearningHints: true },
  completedTasks: [],
  shieldLevel: 'initial',
  demoSignature: null,
  quizPassed: false,
}

function migrateFromLegacy(parsed: Record<string, unknown>): AppState | null {
  const legacyWallet = parsed.wallet as WalletIdentity | undefined
  if (!legacyWallet || Array.isArray(parsed.wallets)) return null
  if (!('keystoreJson' in legacyWallet)) return null

  const id = crypto.randomUUID()
  const identity: WalletIdentity = {
    id,
    address: legacyWallet.address,
    keystoreJson: legacyWallet.keystoreJson,
    walletPassword: legacyWallet.walletPassword,
    nickname: legacyWallet.nickname,
    createdAt: legacyWallet.createdAt,
    chainId: legacyWallet.chainId ?? 11155111,
    hasViewedBackup: Boolean(parsed.hasViewedBackup),
    hasCopiedAddress: Boolean(parsed.hasCopiedAddress),
  }

  return {
    ...defaultState,
    wallets: [identity],
    activeWalletId: id,
    completedTasks: (parsed.completedTasks as TaskId[]) ?? [],
    shieldLevel: (parsed.shieldLevel as AppState['shieldLevel']) ?? 'initial',
    demoSignature: (parsed.demoSignature as string | null) ?? null,
    quizPassed: Boolean(parsed.quizPassed),
    settings: {
      showLearningHints:
        (parsed.settings as AppState['settings'] | undefined)
          ?.showLearningHints ?? true,
    },
    addressBook:
      (parsed.addressBook as AppState['addressBook']) ?? [],
  }
}

export function getActiveWallet(state: AppState): WalletIdentity | null {
  if (!state.activeWalletId) return null
  return state.wallets.find((w) => w.id === state.activeWalletId) ?? null
}

function parseStoredState(parsed: Record<string, unknown>): AppState | null {
  const migrated = migrateFromLegacy(parsed)
  if (migrated) return migrated
  if (!Array.isArray(parsed.wallets)) return null
  const state = { ...defaultState, ...parsed } as AppState
  if (!Array.isArray(state.txHistory)) state.txHistory = []
  return state
}

const STORAGE_KEYS = [
  STORAGE_KEY,
  'planet-wallet-state-v4',
  'planet-wallet-state-v3',
  'planet-wallet-state-v2',
] as const

/** 优先选用钱包数量最多的存档，避免 v5 空数据盖住 v4 里真实钱包 */
export function loadState(): AppState {
  try {
    let best: { state: AppState; key: string } | null = null

    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const state = parseStoredState(parsed)
      if (!state) continue

      const count = state.wallets.length
      if (!best || count > best.state.wallets.length) {
        best = { state, key }
      }
    }

    if (!best) return { ...defaultState }

    if (best.key !== STORAGE_KEY) {
      saveState(best.state)
    } else if (!localStorage.getItem(STORAGE_KEY)) {
      saveState(best.state)
    }

    return best.state
  } catch {
    return { ...defaultState }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const TASK_META: Record<
  TaskId,
  { title: string; description: string; route: string; reviewLabel?: string }
> = {
  light_planet: {
    title: '点亮星球',
    description: '创建你的第一个身份钱包',
    route: '/create',
    reviewLabel: '查看身份管理',
  },
  save_key: {
    title: '保存钥匙',
    description: '查看并理解助记词备份',
    route: '/planet',
    reviewLabel: '再次查看备份',
  },
  know_address: {
    title: '认识地址',
    description: '复制你的钱包地址',
    route: '/planet',
    reviewLabel: '再次查看地址',
  },
  first_sign: {
    title: '第一次签名',
    description: '体验 Demo 消息签名',
    route: '/sign',
    reviewLabel: '再次练习签名',
  },
  shield_quiz: {
    title: '开启护盾',
    description: '完成安全知识问答',
    route: '/sign',
    reviewLabel: '复习安全问答',
  },
}
