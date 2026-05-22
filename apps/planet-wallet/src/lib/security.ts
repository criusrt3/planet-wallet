/**
 * 签名翻译器 + 风险自检
 * 规则对齐 token-ui/security/SKILL.md（四档风险、签名前可读解释）
 */
import type { RiskLevel, ShieldLevel, SignActionType, SignAnalysis } from '@/types'

/** 与 token-ui/security/SKILL.md 对齐 */
export const SECURITY_SKILL_REF =
  'token-ui/security/SKILL.md · 四档风险 · 授权/合约/地址欺诈'

const SIGN_COPY: Record<
  SignActionType,
  { title: string; aiTranslation: string; detail: string; irreversible: boolean }
> = {
  personal_sign: {
    title: '身份确认签名',
    aiTranslation: '这是一次身份确认，不会转移资产，也不会消耗 Gas。',
    detail: '对方只能验证你拥有这个地址，无法动用钱包里的代币。',
    irreversible: false,
  },
  eth_sendTransaction: {
    title: '链上转账',
    aiTranslation: '这是一笔链上交易，可能消耗 Gas，且无法撤回。',
    detail: '请再次核对收款地址、金额与 Sepolia 测试网 Gas 费用。',
    irreversible: true,
  },
  approve: {
    title: '代币授权',
    aiTranslation:
      '这是授权操作，对方可能在未来动用你授权额度内的资产。',
    detail: '无限额度授权风险极高。建议只授权本次所需金额。',
    irreversible: true,
  },
  swap: {
    title: '代币兑换（Swap）',
    aiTranslation:
      'Swap 会按市场价交换代币，通常需先授权 DEX 合约，并支付 Gas。',
    detail:
      '注意滑点与池子流动性。测试网演示中请用小额度，并理解 Approve 与 Swap 是两步操作。',
    irreversible: true,
  },
  unknown_contract: {
    title: '未知合约交互',
    aiTranslation: '我无法确认这个合约的安全性，建议谨慎操作。',
    detail: '合约未验证或函数无法识别时，不应盲目确认。',
    irreversible: true,
  },
}

export function analyzeSignRequest(
  actionType: SignActionType = 'personal_sign',
): SignAnalysis {
  const copy = SIGN_COPY[actionType]
  let riskLevel: RiskLevel = 'info'
  let canProceed = true

  switch (actionType) {
    case 'personal_sign':
      riskLevel = 'info'
      break
    case 'eth_sendTransaction':
      riskLevel = 'warning'
      break
    case 'approve':
    case 'swap':
      riskLevel = 'danger'
      break
    case 'unknown_contract':
      riskLevel = 'danger'
      canProceed = false
      break
  }

  return {
    actionType,
    riskLevel,
    canProceed,
    skillRef: SECURITY_SKILL_REF,
    ...copy,
  }
}

export function getDemoSignAnalysis(): SignAnalysis {
  return analyzeSignRequest('personal_sign')
}

export interface ShieldLevelMeta {
  label: string
  description: string
  color: string
  /** 展示顺序 1→4，数字越大等级越高 */
  rank: number
  unlockCondition: string
}

/** 护盾等级从低到高：初始 → 蓝 → 紫 → 金（与 computeShieldLevel 一致） */
export const SHIELD_LEVEL_ORDER = [
  'initial',
  'blue',
  'purple',
  'gold',
] as const satisfies readonly ShieldLevel[]

export const SHIELD_COPY: Record<ShieldLevel, ShieldLevelMeta> = {
  initial: {
    rank: 1,
    label: '初始护盾',
    description: '钱包已创建，尚未完成基础安全任务。',
    color: 'text-muted-foreground',
    unlockCondition:
      '默认等级。完成「点亮星球」或任一基础任务后可升至蓝色。',
  },
  blue: {
    rank: 2,
    label: '蓝色护盾',
    description: '已理解助记词备份与地址认知。',
    color: 'text-primary',
    unlockCondition:
      '完成「点亮星球」「保存钥匙」「认识地址」中任意一项。',
  },
  purple: {
    rank: 3,
    label: '紫色护盾',
    description: '能区分登录签名、授权与转账，或完成实战挑战。',
    color: 'text-ai-text',
    unlockCondition:
      '完成「第一次安全签名」，或完成「危险授权 / 假空投 / 地址投毒」任一实战任务。',
  },
  gold: {
    rank: 4,
    label: '金色护盾',
    description: '8 项新手任务全部完成且通过安全护照问答。',
    color: 'text-warning',
    unlockCondition:
      '8/8 任务完成 + 在护照页通过安全问答（生成链上护照）。',
  },
}

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: '助记词丢失后，钱包服务商能帮你找回吗？',
    options: ['能，联系客服即可', '不能，只有你自己能备份', '有时可以'],
    correct: 1,
  },
  {
    id: 'q2',
    question: '「登录签名 / Sign Message」通常会直接转走资产吗？',
    options: ['一定会', '不会，主要是身份确认', '看心情'],
    correct: 1,
  },
  {
    id: 'q3',
    question: '看到「Approve 无限额度」时，新手应该？',
    options: ['赶紧点确认', '提高警惕，尽量拒绝或限额', '无所谓'],
    correct: 1,
  },
] as const

export type SecuritySkillRuleId =
  | 'skill_1_1_malicious_contract'
  | 'skill_1_2_address_tail_collision'
  | 'skill_1_3_memo_phishing'
  | 'skill_1_4_fake_airdrop'
  | 'skill_2_2_unlimited_approve'
  | 'skill_2_2_unverified_contract'
  | 'skill_blocklist'

export interface ChainInteractionInput {
  direction: 'in' | 'out' | 'self'
  method: string
  valueEth: string
  counterparty: string
  counterpartyIsContract?: boolean
  inputData?: string
  isApprove?: boolean
  isContractCall?: boolean
}

export interface InteractionSkillAssessment {
  skillRuleId: SecuritySkillRuleId | null
  actionType: SignActionType
  analysis: SignAnalysis
  /** Skill 章节说明（给用户看的检查项） */
  skillNote: string
}

const MAX_UINT256_HEX =
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

const PHISHING_PATTERNS = [
  /https?:\/\//i,
  /t\.me\//i,
  /telegram/i,
  /support@/i,
  /客服/i,
  /official.*wallet/i,
]

/** 将链上交易样本映射为 Security Skill 定义的签名类型 */
export function classifyChainInteraction(
  tx: ChainInteractionInput,
): SignActionType {
  if (tx.isApprove || tx.method.toLowerCase().includes('approve')) {
    return 'approve'
  }
  const m = tx.method.toLowerCase()
  if (m.includes('swap') || m.includes('exactinput')) {
    return 'swap'
  }
  if (tx.isContractCall) {
    return 'unknown_contract'
  }
  if (tx.direction === 'out' && Number.parseFloat(tx.valueEth) > 0) {
    return 'eth_sendTransaction'
  }
  return 'personal_sign'
}

function isUnlimitedApprove(inputData?: string): boolean {
  if (!inputData || inputData.length < 138) return false
  const body = inputData.replace(/^0x/i, '')
  if (!body.startsWith('095ea7b3')) return false
  const amountHex = body.slice(74, 138)
  return amountHex.toLowerCase() === MAX_UINT256_HEX
}

function looksLikeMemoPhishing(inputData?: string, method?: string): boolean {
  const blob = `${method ?? ''} ${inputData ?? ''}`.toLowerCase()
  return PHISHING_PATTERNS.some((p) => p.test(blob))
}

function sharesAddressTail(candidate: string, reference: string): boolean {
  const a = candidate.toLowerCase()
  const b = reference.toLowerCase()
  if (a.length < 10 || b.length < 10 || a === b) return false
  return a.slice(0, 6) === b.slice(0, 6) && a.slice(-4) === b.slice(-4)
}

/** 单笔交互：套用 Skill 四档 + 文案（与签名翻译器同源） */
export function assessInteractionWithSkill(
  tx: ChainInteractionInput,
  context?: { scannedAddress?: string },
): InteractionSkillAssessment {
  const actionType = classifyChainInteraction(tx)
  const analysis = analyzeSignRequest(actionType)
  let skillRuleId: SecuritySkillRuleId | null = null
  let skillNote = 'Skill §2.1 显式展示意图后再确认'

  if (isUnlimitedApprove(tx.inputData)) {
    skillRuleId = 'skill_2_2_unlimited_approve'
    analysis.riskLevel = 'danger'
    analysis.canProceed = false
    analysis.aiTranslation =
      '检测到无限额度授权（uint256 max）。Security Skill 要求 Danger 级警示并避免默认通过。'
    analysis.detail =
      '无限授权后合约可随时转走代币。应改为「仅授权本次所需金额」或拒绝。'
    skillNote = 'Skill §1.1 / §2.2：无限 Approve → Danger'
  } else if (tx.isApprove) {
    skillRuleId = 'skill_1_1_malicious_contract'
    skillNote = 'Skill §1.1：代币授权，核对合约与额度'
  } else if (
    tx.isContractCall &&
    tx.counterpartyIsContract &&
    actionType === 'unknown_contract'
  ) {
    skillRuleId = 'skill_2_2_unverified_contract'
    analysis.riskLevel = 'danger'
    analysis.canProceed = false
    skillNote = 'Skill §1.1：未识别合约调用 → 勿盲目确认'
  } else if (looksLikeMemoPhishing(tx.inputData, tx.method)) {
    skillRuleId = 'skill_1_3_memo_phishing'
    analysis.riskLevel = 'warning'
    skillNote = 'Skill §1.3：附言/数据含链接或客服话术，可能是钓鱼'
  } else if (
    tx.direction === 'in' &&
    Number.parseFloat(tx.valueEth) < 0.000001 &&
    context?.scannedAddress &&
    sharesAddressTail(tx.counterparty, context.scannedAddress)
  ) {
    skillRuleId = 'skill_1_2_address_tail_collision'
    analysis.riskLevel = 'warning'
    analysis.aiTranslation =
      '收到来自「首尾相似地址」的尘埃转账，可能是地址尾号碰撞诈骗（复制历史地址时看错）。'
    analysis.detail =
      'Skill §1.2：不要从历史记录复制地址；请用地址本并核对完整 0x 地址。'
    skillNote = 'Skill §1.2：地址尾号碰撞 / 尘埃污染'
  } else if (
    tx.direction === 'in' &&
    Number.parseFloat(tx.valueEth) < 0.000001
  ) {
    skillRuleId = 'skill_1_4_fake_airdrop'
    analysis.riskLevel = 'warning'
    skillNote = 'Skill §1.4：零值转入可能是假空投诱饵'
  }

  return { skillRuleId, actionType, analysis, skillNote }
}

export interface AddressSkillFlag {
  id: string
  level: RiskLevel
  title: string
  detail: string
  skillRuleId: SecuritySkillRuleId
}

export interface AddressSkillReport {
  riskLevel: RiskLevel
  riskScore: number
  flags: AddressSkillFlag[]
  summary: string
  aiAdvice: string
  interactionAssessments: InteractionSkillAssessment[]
  approveCount: number
  contractCallCount: number
  uniqueCounterparties: number
}

/** 地址级汇总：链上样本 + Security Skill 规则 */
export function analyzeAddressWithSecuritySkill(params: {
  scannedAddress: string
  isContract: boolean
  isScamFlagged: boolean
  reputation: string | null
  totalTxCount: number | null
  outgoingTxCount: number
  interactions: ChainInteractionInput[]
}): AddressSkillReport {
  const interactionAssessments = params.interactions.map((tx) =>
    assessInteractionWithSkill(tx, { scannedAddress: params.scannedAddress }),
  )

  const flags: AddressSkillFlag[] = []
  let score = 0

  const approveCount = interactionAssessments.filter(
    (a) => a.actionType === 'approve',
  ).length
  const contractCallCount = params.interactions.filter(
    (t) => t.isContractCall,
  ).length
  const uniqueCounterparties = new Set(
    params.interactions.map((t) => t.counterparty.toLowerCase()).filter(Boolean),
  ).size

  if (params.isScamFlagged) {
    score += 50
    flags.push({
      id: 'scam',
      level: 'block',
      title: '黑名单 / 可疑地址（Skill Block）',
      detail: '符合 Skill §2.2 Block：已确认或高度可疑地址，应硬拦截交互。',
      skillRuleId: 'skill_blocklist',
    })
  }

  if (params.reputation && params.reputation !== 'ok') {
    score += 25
    flags.push({
      id: 'reputation',
      level: 'danger',
      title: '链上声誉异常（Skill Danger）',
      detail: '声誉标签非 ok，按 Skill §2.2 作 Danger 处理，避免授权与转账。',
      skillRuleId: 'skill_blocklist',
    })
  }

  const unlimitedApproves = interactionAssessments.filter(
    (a) => a.skillRuleId === 'skill_2_2_unlimited_approve',
  )
  if (unlimitedApproves.length > 0) {
    score += 35
    flags.push({
      id: 'unlimited-approve',
      level: 'danger',
      title: `发现 ${unlimitedApproves.length} 笔无限额度授权`,
      detail:
        'Skill §1.1 / §2.2：无限 Approve 必须 Danger 级提示，建议撤销并限额授权。',
      skillRuleId: 'skill_2_2_unlimited_approve',
    })
  } else if (approveCount >= 2) {
    score += 20
    flags.push({
      id: 'multi-approve',
      level: 'danger',
      title: `近期 ${approveCount} 笔授权（Approve）`,
      detail: 'Skill §1.1：多次授权扩大被盗面，逐笔核对合约与额度。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  } else if (approveCount === 1) {
    score += 8
    flags.push({
      id: 'approve',
      level: 'warning',
      title: '近期存在代币授权',
      detail: 'Skill §1.1：授权为可逆但高风险操作，确认对方合约可信。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  }

  const unknownCalls = interactionAssessments.filter(
    (a) => a.actionType === 'unknown_contract' && a.analysis.riskLevel === 'danger',
  )
  if (unknownCalls.length > 0) {
    score += 18
    flags.push({
      id: 'unknown-contract',
      level: 'danger',
      title: ` ${unknownCalls.length} 次未知合约交互`,
      detail: 'Skill §1.1：无法解读的合约调用不应盲目签名。',
      skillRuleId: 'skill_2_2_unverified_contract',
    })
  }

  const tailCollision = interactionAssessments.filter(
    (a) => a.skillRuleId === 'skill_1_2_address_tail_collision',
  )
  if (tailCollision.length > 0) {
    score += 15
    flags.push({
      id: 'tail-collision',
      level: 'warning',
      title: '疑似地址尾号碰撞尘埃转账',
      detail:
        'Skill §1.2：勿从历史记录复制收款地址；使用地址本并核对完整地址。',
      skillRuleId: 'skill_1_2_address_tail_collision',
    })
  }

  const dustInbound = interactionAssessments.filter(
    (a) => a.skillRuleId === 'skill_1_4_fake_airdrop',
  )
  if (dustInbound.length >= 2) {
    score += 12
    flags.push({
      id: 'dust-airdrop',
      level: 'warning',
      title: '多笔零值/尘埃转入（假空投风险）',
      detail:
        'Skill §1.4：假冒代币空投常诱导 Approve，勿点击来路不明「领取」链接。',
      skillRuleId: 'skill_1_4_fake_airdrop',
    })
  }

  const zeroAddr = '0x0000000000000000000000000000000000000000'
  if (
    params.interactions.some(
      (t) => t.counterparty.toLowerCase() === zeroAddr,
    )
  ) {
    score += 30
    flags.push({
      id: 'zero',
      level: 'danger',
      title: '与零地址存在交互',
      detail: '与 0x0 地址交互异常，可能是销毁或恶意构造交易。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  }

  const phishing = interactionAssessments.filter(
    (a) => a.skillRuleId === 'skill_1_3_memo_phishing',
  )
  if (phishing.length > 0) {
    score += 10
    flags.push({
      id: 'memo-phish',
      level: 'warning',
      title: '交易附言含可疑联系/链接',
      detail:
        'Skill §1.3：附言为发送方写入，非钱包官方通知；勿拨打或点击其中链接。',
      skillRuleId: 'skill_1_3_memo_phishing',
    })
  }

  if (
    params.totalTxCount !== null &&
    params.totalTxCount === 0 &&
    params.outgoingTxCount === 0
  ) {
    flags.push({
      id: 'fresh',
      level: 'info',
      title: '链上无历史（首次交互风险）',
      detail: 'Skill §2.2 Warning：新地址宜小额试转，勿大额直转。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  }

  if (params.isContract) {
    flags.push({
      id: 'contract-addr',
      level: 'info',
      title: '目标为合约地址',
      detail: 'Skill §2.1：向合约转账可能触发逻辑，非简单收款。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  }

  if (flags.length === 0) {
    flags.push({
      id: 'ok',
      level: 'info',
      title: '样本内未见 Skill 典型高危模式',
      detail:
        '已按 Security Skill 四档规则扫描；仍请结合完整链上历史自行判断。',
      skillRuleId: 'skill_1_1_malicious_contract',
    })
  }

  let riskLevel: RiskLevel = 'info'
  for (const a of interactionAssessments) {
    if (a.analysis.riskLevel === 'block') riskLevel = 'block'
    else if (a.analysis.riskLevel === 'danger' && riskLevel !== 'block') {
      riskLevel = 'danger'
    } else if (a.analysis.riskLevel === 'warning' && riskLevel === 'info') {
      riskLevel = 'warning'
    }
  }
  if (score >= 45 || flags.some((f) => f.level === 'block')) riskLevel = 'block'
  else if (score >= 22 || flags.some((f) => f.level === 'danger'))
    riskLevel = 'danger'
  else if (score >= 8 || flags.some((f) => f.level === 'warning'))
    riskLevel = 'warning'

  const summary =
    riskLevel === 'block'
      ? 'Security Skill：建议 Block，停止与该地址交互。'
      : riskLevel === 'danger'
        ? 'Security Skill：Danger，存在授权/未知合约等高危交互。'
        : riskLevel === 'warning'
          ? 'Security Skill：Warning，留意尘埃转账、附言钓鱼等。'
          : 'Security Skill：当前样本风险较低，转账前仍须核对完整地址。'

  const aiAdvice =
    riskLevel === 'block' || riskLevel === 'danger'
      ? '遵循 Skill：勿向该地址转账；拒绝未知 Approve；使用地址本核对完整 0x 地址。'
      : '遵循 Skill：区分登录签名与转账；对 Approve 限额；忽略附言中的客服/链接。'

  return {
    riskLevel,
    riskScore: Math.min(100, score),
    flags,
    summary,
    aiAdvice,
    interactionAssessments,
    approveCount,
    contractCallCount,
    uniqueCounterparties,
  }
}
