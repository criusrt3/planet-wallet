import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Address } from 'viem'
import {
  computeShieldLevel,
  generateManifesto,
  getNavigatorMessage,
} from '@/lib/ai-navigator'
import {
  cancelSensitiveAction,
  confirmSensitiveAction,
} from '@/lib/confirm-action'
import {
  assetKey,
  DEFAULT_ENABLED_CHAIN_IDS,
  explorerAddressUrl,
  getChainById,
  getTokenByAssetKey,
  getTokenById,
  SEPOLIA_CHAIN_ID,
} from '@/lib/chains'
import { fetchMultiChainBalances, sendSepoliaTransfer } from '@/lib/evm'
import type { TokenBalance } from '@/lib/evm'
import { executeSepoliaSwap } from '@/lib/swap'
import {
  createShieldPulse,
  findSimilarAddressWarning,
  type ShieldPulse,
} from '@/lib/shield-monitor'
import { QUIZ_QUESTIONS } from '@/lib/security'
import {
  defaultState,
  getActiveWallet,
  loadState,
  MAX_WALLETS,
  saveState,
  STORAGE_KEY,
} from '@/lib/storage'
import { applyTheme } from '@/lib/theme'
import {
  hashWalletLockPassword,
  validateWalletLockPassword,
  verifyWalletLockPassword,
} from '@/lib/wallet-lock'
import { clearTcxSession } from '@/lib/tcx-wallet'
import {
  createPlanetWallet,
  generateNickname,
  signDemoMessage,
} from '@/lib/wallet'
import type {
  AddressBookEntry,
  AppState,
  AppTheme,
  ShieldLevel,
  TaskId,
  TokenBalanceView,
  TxHistoryEntry,
  WalletIdentity,
} from '@/types'

interface WalletContextValue extends AppState {
  wallet: WalletIdentity | null
  navigatorText: string
  balances: TokenBalanceView[]
  balancesLoading: boolean
  lastTxHash: string | null
  canCreateWallet: boolean
  completeTask: (id: TaskId) => void
  emitShieldPulse: (pulse: ShieldPulse) => void
  warnScreenshotAttempt: () => void
  checkTransferRecipient: (to: string) => string | null
  createWallet: () => Promise<WalletIdentity>
  switchWallet: (id: string) => void
  removeWallet: (id: string) => Promise<void>
  markBackupViewed: () => void
  markAddressCopied: () => void
  updateWalletProfile: (
    walletId: string,
    profile: { nickname: string; note?: string },
  ) => void
  refreshBalances: () => Promise<void>
  setWalletChainEnabled: (chainId: string, enabled: boolean) => void
  runDemoSign: () => Promise<string>
  sendTransfer: (params: {
    assetKey: string
    to: string
    amount: string
  }) => Promise<string>
  sendSwap: (params: {
    fromTokenId: string
    toTokenId: string
    amountIn: string
  }) => Promise<{ approveHash?: string; swapHash: string }>
  clearTxHistory: () => Promise<void>
  addAddressBookEntry: (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => void
  removeAddressBookEntry: (id: string) => Promise<void>
  setShowLearningHints: (value: boolean) => void
  setTheme: (theme: AppTheme) => void
  /** 钱包页已解锁（未开启锁时恒为 true） */
  isWalletPageUnlocked: boolean
  unlockWalletPage: (password: string) => Promise<boolean>
  lockWalletPage: () => void
  enableWalletPageLock: (password: string) => Promise<boolean>
  disableWalletPageLock: (currentPassword: string) => Promise<boolean>
  changeWalletPageLockPassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>
  submitQuiz: (answers: number[]) => boolean
  resetDemo: () => Promise<void>
  manifesto: string
}

const WalletContext = createContext<WalletContextValue | null>(null)

function syncShield(state: AppState): ShieldLevel {
  return computeShieldLevel(state.completedTasks, state.quizPassed)
}

function markTask(state: AppState, id: TaskId): AppState {
  const already = state.completedTasks.includes(id)
  const completed = already
    ? state.completedTasks
    : [...state.completedTasks, id]
  let next: AppState = { ...state, completedTasks: completed }
  next = { ...next, shieldLevel: syncShield(next) }
  if (!already) {
    next = {
      ...next,
      shieldPulse: createShieldPulse('task_level_up'),
    }
  }
  return next
}

function updateWallet(
  state: AppState,
  walletId: string,
  patch: Partial<WalletIdentity>,
): AppState {
  return {
    ...state,
    wallets: state.wallets.map((w) =>
      w.id === walletId ? { ...w, ...patch } : w,
    ),
  }
}

function appendHistory(
  state: AppState,
  entry: Omit<TxHistoryEntry, 'id' | 'createdAt'>,
): AppState {
  const record: TxHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  return {
    ...state,
    txHistory: [record, ...state.txHistory].slice(0, 200),
  }
}

function mapBalances(rows: TokenBalance[]): TokenBalanceView[] {
  return rows.map((r) => ({
    id: assetKey(r.chainId, r.token.id),
    chainId: r.chainId,
    chainName: r.chainName,
    tokenId: r.token.id,
    symbol: r.token.symbol,
    name: r.token.name,
    formatted: r.formatted,
    decimals: r.token.decimals,
    color: r.token.color,
    isNative: r.token.address === null,
  }))
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [balances, setBalances] = useState<TokenBalanceView[]>([])
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)
  const [walletPageUnlocked, setWalletPageUnlocked] = useState(false)

  const wallet = useMemo(() => getActiveWallet(state), [state])

  useEffect(() => {
    applyTheme(state.settings.theme)
  }, [state.settings.theme])

  const persist = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  const refreshBalances = useCallback(async () => {
    const current = loadState()
    const active = getActiveWallet(current)
    if (!active) return
    setBalancesLoading(true)
    try {
      const rows = await fetchMultiChainBalances(
        active.address as Address,
        active.enabledChainIds,
      )
      setBalances(mapBalances(rows))
    } finally {
      setBalancesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (wallet) {
      void refreshBalances()
    } else {
      setBalances([])
    }
  }, [wallet?.id, wallet?.address, wallet?.enabledChainIds?.join(','), refreshBalances])

  const setWalletChainEnabled = useCallback(
    (chainId: string, enabled: boolean) => {
      if (!wallet) return
      if (!getChainById(chainId)) return
      persist((prev) => {
        const w = prev.wallets.find((x) => x.id === wallet.id)
        if (!w) return prev
        let ids = [...(w.enabledChainIds ?? [...DEFAULT_ENABLED_CHAIN_IDS])]
        if (enabled && !ids.includes(chainId)) ids.push(chainId)
        if (!enabled) {
          ids = ids.filter((c) => c !== chainId)
          if (ids.length === 0) ids = [...DEFAULT_ENABLED_CHAIN_IDS]
        }
        return updateWallet(prev, wallet.id, { enabledChainIds: ids })
      })
    },
    [persist, wallet],
  )

  const switchWallet = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, activeWalletId: id }))
      setLastTxHash(null)
    },
    [persist],
  )

  const createWallet = useCallback(async () => {
    const current = loadState()
    if (current.wallets.length >= MAX_WALLETS) {
      throw new Error(`最多创建 ${MAX_WALLETS} 个身份钱包`)
    }
    const { address, keystoreJson, walletPassword, chainId } =
      await createPlanetWallet()
    const identity: WalletIdentity = {
      id: crypto.randomUUID(),
      address,
      keystoreJson,
      walletPassword,
      nickname: generateNickname(),
      note: undefined,
      createdAt: new Date().toISOString(),
      chainId: chainId ?? SEPOLIA_CHAIN_ID,
      enabledChainIds: [...DEFAULT_ENABLED_CHAIN_IDS],
      hasViewedBackup: false,
      hasCopiedAddress: false,
    }
    persist((prev) => {
      let next: AppState = {
        ...prev,
        wallets: [...prev.wallets, identity],
        activeWalletId: identity.id,
      }
      if (prev.wallets.length === 0) {
        next = markTask(next, 'light_planet')
      }
      next = appendHistory(next, {
        walletId: identity.id,
        walletNickname: identity.nickname,
        type: 'create_wallet',
        title: '创建身份钱包',
        summary: `地址 ${identity.address.slice(0, 10)}…`,
        hash: '',
        explorerUrl: explorerAddressUrl('sepolia', identity.address),
      })
      return next
    })
    return identity
  }, [persist])

  const removeWallet = useCallback(
    async (id: string) => {
      const target = loadState().wallets.find((w) => w.id === id)
      if (
        !(await confirmSensitiveAction(
          'remove_wallet',
          target
            ? `身份：${target.nickname}\n地址：${target.address}`
            : undefined,
        ))
      ) {
        return
      }
      persist((prev) => {
        const wallets = prev.wallets.filter((w) => w.id !== id)
        let activeWalletId = prev.activeWalletId
        if (activeWalletId === id) {
          activeWalletId = wallets[0]?.id ?? null
        }
        return { ...prev, wallets, activeWalletId }
      })
    },
    [persist],
  )

  const completeTask = useCallback(
    (id: TaskId) => persist((prev) => markTask(prev, id)),
    [persist],
  )

  const emitShieldPulse = useCallback(
    (pulse: ShieldPulse) => {
      persist((prev) => ({ ...prev, shieldPulse: pulse }))
    },
    [persist],
  )

  const warnScreenshotAttempt = useCallback(() => {
    emitShieldPulse(createShieldPulse('screenshot_warn'))
  }, [emitShieldPulse])

  const checkTransferRecipient = useCallback(
    (to: string): string | null => {
      if (!wallet) return null
      const refs = [
        wallet.address,
        ...state.addressBook.map((e) => e.address),
        ...state.txHistory
          .filter((h) => h.type === 'transfer')
          .map((h) => h.summary)
          .filter((s) => s.includes('0x')),
      ]
      const warn = findSimilarAddressWarning(to, refs)
      if (warn) {
        emitShieldPulse(createShieldPulse('similar_address'))
      }
      return warn
    },
    [wallet, state.addressBook, state.txHistory, emitShieldPulse],
  )

  const markBackupViewed = useCallback(() => {
    if (!wallet) return
    persist((prev) => {
      let next = updateWallet(prev, wallet.id, { hasViewedBackup: true })
      next = markTask(next, 'save_key')
      return { ...next, shieldPulse: createShieldPulse('backup_done') }
    })
  }, [persist, wallet])

  const markAddressCopied = useCallback(() => {
    if (!wallet) return
    persist((prev) => {
      let next = updateWallet(prev, wallet.id, { hasCopiedAddress: true })
      return markTask(next, 'know_address')
    })
  }, [persist, wallet])

  const updateWalletProfile = useCallback(
    (walletId: string, profile: { nickname: string; note?: string }) => {
      const nickname = profile.nickname.trim()
      if (!nickname) return
      const note = (profile.note ?? '').trim().slice(0, 200)
      persist((prev) =>
        updateWallet(prev, walletId, { nickname, note: note || undefined }),
      )
    },
    [persist],
  )

  const runDemoSign = useCallback(async () => {
    const current = loadState()
    const active = getActiveWallet(current)
    if (!active) throw new Error('请先创建钱包')
    const sig = await signDemoMessage(
      active.keystoreJson,
      active.walletPassword,
    )
    persist((prev) => {
      let next = markTask({ ...prev, demoSignature: sig }, 'first_sign')
      next = appendHistory(next, {
        walletId: active.id,
        walletNickname: active.nickname,
        type: 'sign',
        title: 'Demo 消息签名',
        summary: sig.slice(0, 18) + '…',
        hash: '',
        explorerUrl: '',
      })
      return next
    })
    return sig
  }, [persist])

  const sendTransfer = useCallback(
    async (params: { assetKey: string; to: string; amount: string }) => {
      const current = loadState()
      const active = getActiveWallet(current)
      if (!active) throw new Error('请先创建钱包')
      const resolved = getTokenByAssetKey(params.assetKey)
      const poisonWarn = findSimilarAddressWarning(params.to, [
        active.address,
        ...current.addressBook.map((e) => e.address),
      ])
      if (poisonWarn) {
        persist((prev) => ({
          ...prev,
          shieldPulse: createShieldPulse('similar_address'),
        }))
      }
      if (
        !(await confirmSensitiveAction(
          'send_transfer',
          `链：${resolved?.chain.shortName ?? ''}\n代币：${resolved?.token.symbol ?? params.assetKey}\n数量：${params.amount}\n收款：${params.to}${poisonWarn ? `\n\n⚠ ${poisonWarn}` : ''}`,
        ))
      ) {
        cancelSensitiveAction()
      }
      const { hash, explorerUrl } = await sendSepoliaTransfer({
        keystoreJson: active.keystoreJson,
        walletPassword: active.walletPassword,
        from: active.address as Address,
        assetKey: params.assetKey,
        to: params.to,
        amount: params.amount,
      })
      setLastTxHash(hash)
      persist((prev) =>
        appendHistory(prev, {
          walletId: active.id,
          walletNickname: active.nickname,
          type: 'transfer',
          title: `转账 ${resolved?.token.symbol ?? params.assetKey}`,
          summary: `${params.amount} → ${params.to.slice(0, 8)}…`,
          hash,
          explorerUrl,
        }),
      )
      await refreshBalances()
      return hash
    },
    [persist, refreshBalances],
  )

  const sendSwap = useCallback(
    async (params: {
      fromTokenId: string
      toTokenId: string
      amountIn: string
    }) => {
      const current = loadState()
      const active = getActiveWallet(current)
      if (!active) throw new Error('请先创建钱包')
      const fromToken = getTokenById(params.fromTokenId)
      const toToken = getTokenById(params.toTokenId)
      if (
        !(await confirmSensitiveAction(
          'send_swap',
          `支付：${params.amountIn} ${fromToken?.symbol ?? params.fromTokenId}\n获得：${toToken?.symbol ?? params.toTokenId}\n${fromToken?.id !== 'eth' ? '（含 ERC-20 授权）' : ''}`,
        ))
      ) {
        cancelSensitiveAction()
      }
      const { approve, swap } = await executeSepoliaSwap({
        keystoreJson: active.keystoreJson,
        walletPassword: active.walletPassword,
        from: active.address as Address,
        fromTokenId: params.fromTokenId,
        toTokenId: params.toTokenId,
        amountIn: params.amountIn,
      })
      setLastTxHash(swap.hash)
      persist((prev) => {
        let next = prev
        if (approve) {
          next = appendHistory(next, {
            walletId: active.id,
            walletNickname: active.nickname,
            type: 'approve',
            title: `授权 ${fromToken?.symbol ?? ''}`,
            summary: `允许 Uniswap 使用 ${params.amountIn} ${fromToken?.symbol ?? ''}`,
            hash: approve.hash,
            explorerUrl: approve.explorerUrl,
          })
        }
        next = appendHistory(next, {
          walletId: active.id,
          walletNickname: active.nickname,
          type: 'swap',
          title: `兑换 ${fromToken?.symbol} → ${toToken?.symbol}`,
          summary: `支付 ${params.amountIn} ${fromToken?.symbol}`,
          hash: swap.hash,
          explorerUrl: swap.explorerUrl,
        })
        return next
      })
      await refreshBalances()
      return {
        approveHash: approve?.hash,
        swapHash: swap.hash,
      }
    },
    [persist, refreshBalances],
  )

  const clearTxHistory = useCallback(async () => {
    const active = getActiveWallet(loadState())
    if (
      !(await confirmSensitiveAction(
        'clear_tx_history',
        active ? `当前身份：${active.nickname}` : undefined,
      ))
    ) {
      return
    }
    persist((prev) => {
      const wid = prev.activeWalletId
      if (!wid) return prev
      return {
        ...prev,
        txHistory: prev.txHistory.filter((h) => h.walletId !== wid),
      }
    })
  }, [persist])

  const addAddressBookEntry = useCallback(
    (entry: Omit<AddressBookEntry, 'id' | 'createdAt'>) => {
      const item: AddressBookEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      persist((prev) => ({
        ...prev,
        addressBook: [...prev.addressBook, item],
      }))
    },
    [persist],
  )

  const removeAddressBookEntry = useCallback(
    async (id: string) => {
      const entry = loadState().addressBook.find((e) => e.id === id)
      if (
        !(await confirmSensitiveAction(
          'remove_address_book_entry',
          entry ? `标签：${entry.label}\n地址：${entry.address}` : undefined,
        ))
      ) {
        return
      }
      persist((prev) => ({
        ...prev,
        addressBook: prev.addressBook.filter((e) => e.id !== id),
      }))
    },
    [persist],
  )

  const setShowLearningHints = useCallback(
    (value: boolean) => {
      persist((prev) => ({
        ...prev,
        settings: { ...prev.settings, showLearningHints: value },
      }))
    },
    [persist],
  )

  const setTheme = useCallback(
    (theme: AppTheme) => {
      applyTheme(theme)
      persist((prev) => ({
        ...prev,
        settings: { ...prev.settings, theme },
      }))
    },
    [persist],
  )

  const isWalletPageUnlocked =
    !state.settings.walletLockEnabled || walletPageUnlocked

  const lockWalletPage = useCallback(() => {
    setWalletPageUnlocked(false)
  }, [])

  const unlockWalletPage = useCallback(
    async (password: string) => {
      const hash = state.settings.walletLockHash
      if (!hash || !state.settings.walletLockEnabled) {
        setWalletPageUnlocked(true)
        return true
      }
      const ok = await verifyWalletLockPassword(password, hash)
      if (ok) setWalletPageUnlocked(true)
      return ok
    },
    [state.settings.walletLockHash, state.settings.walletLockEnabled],
  )

  const enableWalletPageLock = useCallback(
    async (password: string) => {
      const err = validateWalletLockPassword(password)
      if (err) return false
      const hash = await hashWalletLockPassword(password)
      persist((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          walletLockEnabled: true,
          walletLockHash: hash,
        },
      }))
      setWalletPageUnlocked(false)
      return true
    },
    [persist],
  )

  const disableWalletPageLock = useCallback(
    async (currentPassword: string) => {
      const hash = state.settings.walletLockHash
      if (hash) {
        const ok = await verifyWalletLockPassword(currentPassword, hash)
        if (!ok) return false
      }
      persist((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          walletLockEnabled: false,
          walletLockHash: null,
        },
      }))
      setWalletPageUnlocked(true)
      return true
    },
    [persist, state.settings.walletLockHash],
  )

  const changeWalletPageLockPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const err = validateWalletLockPassword(newPassword)
      if (err) return false
      const hash = state.settings.walletLockHash
      if (!hash) return false
      const ok = await verifyWalletLockPassword(currentPassword, hash)
      if (!ok) return false
      const nextHash = await hashWalletLockPassword(newPassword)
      persist((prev) => ({
        ...prev,
        settings: { ...prev.settings, walletLockHash: nextHash },
      }))
      setWalletPageUnlocked(false)
      return true
    },
    [persist, state.settings.walletLockHash],
  )

  const submitQuiz = useCallback(
    (answers: number[]) => {
      const allCorrect = QUIZ_QUESTIONS.every(
        (q, i) => answers[i] === q.correct,
      )
      if (allCorrect) {
        persist((prev) =>
          markTask({ ...prev, quizPassed: true }, 'security_passport'),
        )
      }
      return allCorrect
    },
    [persist],
  )

  const resetDemo = useCallback(async () => {
    if (!(await confirmSensitiveAction('reset_all_data'))) return
    clearTcxSession()
    for (const key of [
      STORAGE_KEY,
      'planet-wallet-state-v4',
      'planet-wallet-state-v3',
      'planet-wallet-state-v2',
    ]) {
      localStorage.removeItem(key)
    }
    saveState({ ...defaultState })
    setState({ ...defaultState })
    setBalances([])
    setLastTxHash(null)
    setWalletPageUnlocked(false)
    applyTheme('default')
  }, [])

  const navigatorText = useMemo(() => {
    if (!wallet) return getNavigatorMessage('welcome').text
    if (!wallet.hasViewedBackup) return getNavigatorMessage('backup').text
    if (!state.completedTasks.includes('first_sign')) {
      return getNavigatorMessage('sign_intro').text
    }
    if (!state.completedTasks.includes('danger_approve')) {
      return getNavigatorMessage('challenge_approve').text
    }
    if (!state.completedTasks.includes('fake_airdrop')) {
      return getNavigatorMessage('challenge_airdrop').text
    }
    if (!state.completedTasks.includes('address_poison')) {
      return getNavigatorMessage('challenge_poison').text
    }
    if (!state.quizPassed) return getNavigatorMessage('quiz_intro').text
    return getNavigatorMessage('passport').text
  }, [wallet, state.completedTasks, state.quizPassed])

  const manifesto = wallet ? generateManifesto(wallet.nickname) : ''

  const value: WalletContextValue = {
    ...state,
    wallet,
    navigatorText,
    balances,
    balancesLoading,
    lastTxHash,
    canCreateWallet: state.wallets.length < MAX_WALLETS,
    completeTask,
    createWallet,
    switchWallet,
    removeWallet,
    markBackupViewed,
    markAddressCopied,
    updateWalletProfile,
    refreshBalances,
    setWalletChainEnabled,
    runDemoSign,
    sendTransfer,
    sendSwap,
    clearTxHistory,
    addAddressBookEntry,
    removeAddressBookEntry,
    setShowLearningHints,
    setTheme,
    isWalletPageUnlocked,
    unlockWalletPage,
    lockWalletPage,
    enableWalletPageLock,
    disableWalletPageLock,
    changeWalletPageLockPassword,
    submitQuiz,
    emitShieldPulse,
    warnScreenshotAttempt,
    checkTransferRecipient,
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
