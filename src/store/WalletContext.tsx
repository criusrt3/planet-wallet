import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  computeShieldLevel,
  generateManifesto,
  getNavigatorMessage,
} from '@/lib/ai-navigator'
import { QUIZ_QUESTIONS } from '@/lib/security'
import { defaultState, loadState, saveState } from '@/lib/storage'
import {
  createPlanetWallet,
  generateNickname,
  signDemoMessage,
} from '@/lib/wallet'
import type { AppState, ShieldLevel, TaskId, WalletData } from '@/types'

interface WalletContextValue extends AppState {
  navigatorText: string
  completeTask: (id: TaskId) => void
  createWallet: () => Promise<void>
  markBackupViewed: () => void
  markAddressCopied: () => void
  runDemoSign: () => Promise<string>
  submitQuiz: (answers: number[]) => boolean
  resetDemo: () => void
  manifesto: string
}

const WalletContext = createContext<WalletContextValue | null>(null)

function syncShield(state: AppState): ShieldLevel {
  return computeShieldLevel(state.completedTasks, state.quizPassed)
}

function markTask(state: AppState, id: TaskId): AppState {
  const completed = state.completedTasks.includes(id)
    ? state.completedTasks
    : [...state.completedTasks, id]
  const next = { ...state, completedTasks: completed }
  return { ...next, shieldLevel: syncShield(next) }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  const persist = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  const completeTask = useCallback(
    (id: TaskId) => persist((prev) => markTask(prev, id)),
    [persist],
  )

  const createWallet = useCallback(async () => {
    const { address, mnemonic } = await createPlanetWallet()
    const wallet: WalletData = {
      address,
      mnemonic,
      nickname: generateNickname(),
      createdAt: new Date().toISOString(),
    }
    persist((prev) => markTask({ ...prev, wallet, shieldLevel: 'initial' }, 'light_planet'))
  }, [persist])

  const markBackupViewed = useCallback(() => {
    persist((prev) => markTask({ ...prev, hasViewedBackup: true }, 'save_key'))
  }, [persist])

  const markAddressCopied = useCallback(() => {
    persist((prev) => markTask({ ...prev, hasCopiedAddress: true }, 'know_address'))
  }, [persist])

  const runDemoSign = useCallback(async () => {
    const current = loadState()
    if (!current.wallet) throw new Error('请先创建钱包')
    const sig = await signDemoMessage(current.wallet.mnemonic)
    persist((prev) => {
      if (!prev.wallet) return prev
      return markTask({ ...prev, demoSignature: sig }, 'first_sign')
    })
    return sig
  }, [persist])

  const submitQuiz = useCallback(
    (answers: number[]) => {
      const allCorrect = QUIZ_QUESTIONS.every(
        (q, i) => answers[i] === q.correct,
      )
      if (allCorrect) {
        persist((prev) =>
          markTask({ ...prev, quizPassed: true }, 'shield_quiz'),
        )
      }
      return allCorrect
    },
    [persist],
  )

  const resetDemo = useCallback(() => {
    saveState({ ...defaultState })
    setState({ ...defaultState })
  }, [])

  const navigatorText = useMemo(() => {
    if (!state.wallet) return getNavigatorMessage('welcome').text
    if (!state.completedTasks.includes('save_key'))
      return getNavigatorMessage('backup').text
    if (!state.completedTasks.includes('first_sign'))
      return getNavigatorMessage('sign_intro').text
    if (!state.quizPassed) return getNavigatorMessage('quiz_intro').text
    return getNavigatorMessage('passport').text
  }, [state])

  const manifesto = state.wallet
    ? generateManifesto(state.wallet.nickname)
    : ''

  const value: WalletContextValue = {
    ...state,
    navigatorText,
    completeTask,
    createWallet,
    markBackupViewed,
    markAddressCopied,
    runDemoSign,
    submitQuiz,
    resetDemo,
    manifesto,
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
