export type ShieldLevel = 'initial' | 'blue' | 'purple' | 'gold'

export type TaskId =
  | 'light_planet'
  | 'save_key'
  | 'know_address'
  | 'first_sign'
  | 'danger_approve'
  | 'fake_airdrop'
  | 'address_poison'
  | 'security_passport'

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
  | 'security_scan'

export type RiskLevel = 'info' | 'warning' | 'danger' | 'block'

export interface WalletIdentity {
  id: string
  address: string
  keystoreJson: string
  walletPassword: string
  nickname: string
  /** 用户自定义备注（仅本地） */
  note?: string
  createdAt: string
  chainId: number
  /** 要在资产列表中展示余额的测试链 */
  enabledChainIds: string[]
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

export type AppTheme = 'default' | 'light'

export interface AppSettings {
  /** 外观：default 深海蓝 · light 亮白 */
  theme: AppTheme
  /** 操作时显示 AI 学习与风险解释 */
  showLearningHints: boolean
  /** 进入钱包页（/planet）前需输入密码 */
  walletLockEnabled: boolean
  /** SHA-256 十六进制，仅存本机 */
  walletLockHash: string | null
}

export interface TokenBalanceView {
  /** chainId:tokenId */
  id: string
  chainId: string
  chainName: string
  tokenId: string
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

export interface ShieldPulse {
  level: RiskLevel
  message: string
  skillRef?: string
  at: number
}

export interface AppState {
  wallets: WalletIdentity[]
  activeWalletId: string | null
  addressBook: AddressBookEntry[]
  txHistory: TxHistoryEntry[]
  settings: AppSettings
  completedTasks: TaskId[]
  shieldLevel: ShieldLevel
  /** 最近一次护盾实时反馈（教育 + 拦截提示） */
  shieldPulse: ShieldPulse | null
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
  /** 对齐 Security Skill 的规则说明 */
  skillRef?: string
}

export interface NavigatorMessage {
  scene: string
  text: string
  hint?: string
}
