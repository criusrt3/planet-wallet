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
  | 'unknown_contract'

export type RiskLevel = 'info' | 'warning' | 'danger' | 'block'

export interface WalletData {
  address: string
  mnemonic: string
  nickname: string
  createdAt: string
}

export interface AppState {
  wallet: WalletData | null
  completedTasks: TaskId[]
  shieldLevel: ShieldLevel
  hasViewedBackup: boolean
  hasCopiedAddress: boolean
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
