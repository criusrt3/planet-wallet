export type ShieldLevel = 'initial' | 'blue' | 'purple' | 'gold'

export type TaskId =
  | 'light_planet'
  | 'save_key'
  | 'know_address'
  | 'first_sign'
  | 'shield_quiz'

export type SignActionType =
  | 'personal_sign'
  | 'eth_sendTransaction'
  | 'approve'
  | 'swap'
  | 'unknown_contract'

/** 链上操作场景（用于学习提示） */
export type OperationScene =
  | 'create_wallet'
  | 'switch_wallet'
  | 'transfer'
  | 'swap'
  | 'sign'
  | 'approve'
  | 'address_book_add'
  | 'address_book_use'

export type RiskLevel = 'info' | 'warning' | 'danger' | 'block'

export interface WalletIdentity {
  id: string
  address: string
  keystoreJson: string
  walletPassword: string
  nickname: string
  createdAt: string
  chainId: number
  hasViewedBackup: boolean
  hasCopiedAddress: boolean
}

export interface AddressBookEntry {
  id: string
  label: string
  address: string
  note?: string
  createdAt: string
}

export interface AppSettings {
  /** 操作时显示 AI 学习与风险解释 */
  showLearningHints: boolean
}

export interface TokenBalanceView {
  id: string
  symbol: string
  name: string
  formatted: string
  decimals: number
  color: string
  isNative: boolean
}

export type TxHistoryType =
  | 'transfer'
  | 'swap'
  | 'approve'
  | 'sign'
  | 'create_wallet'

export interface TxHistoryEntry {
  id: string
  walletId: string
  walletNickname: string
  type: TxHistoryType
  title: string
  summary: string
  hash: string
  explorerUrl: string
  createdAt: string
}

export interface AppState {
  wallets: WalletIdentity[]
  activeWalletId: string | null
  addressBook: AddressBookEntry[]
  txHistory: TxHistoryEntry[]
  settings: AppSettings
  completedTasks: TaskId[]
  shieldLevel: ShieldLevel
  demoSignature: string | null
  quizPassed: boolean
}

export interface SignAnalysis {
  actionType: SignActionType
  riskLevel: RiskLevel
  title: string
  aiTranslation: string
  detail: string
  canProceed: boolean
  irreversible: boolean
}

export interface NavigatorMessage {
  scene: string
  text: string
  hint?: string
}
