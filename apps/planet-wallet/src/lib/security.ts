/**
 * 签名翻译器 + 风险自检
 * 规则对齐 token-ui/security/SKILL.md（四档风险、签名前可读解释）
 */
import type { RiskLevel, ShieldLevel, SignActionType, SignAnalysis } from '@/types'

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
    ...copy,
  }
}

export function getDemoSignAnalysis(): SignAnalysis {
  return analyzeSignRequest('personal_sign')
}

export const SHIELD_COPY: Record<
  ShieldLevel,
  { label: string; description: string; color: string }
> = {
  initial: {
    label: '初始护盾',
    description: '你的钱包已生成，但还需要学习基础安全操作。',
    color: 'text-muted-foreground',
  },
  blue: {
    label: '蓝色护盾',
    description: '你已经理解钥匙的重要性。',
    color: 'text-primary',
  },
  purple: {
    label: '紫色护盾',
    description: '你能区分登录签名和资产转移。',
    color: 'text-ai-text',
  },
  gold: {
    label: '金色护盾',
    description: '你已经具备基础链上安全意识。',
    color: 'text-warning',
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
