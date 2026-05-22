import type { RiskLevel, ShieldPulse } from '@/types'

export type { ShieldPulse }

export const SHIELD_FEEDBACK = {
  backup_done: {
    level: 'info' as const,
    message: '护盾 +1：你已完成备份提醒，钥匙由你自己保管。',
    skillRef: 'Skill §2.4 · 助记词不可截图、不可外传',
  },
  screenshot_warn: {
    level: 'danger' as const,
    message: '强警告：助记词禁止截图或发给任何人，包括「客服」。',
    skillRef: 'Skill §1.3 · 社工诈骗',
  },
  unknown_dapp: {
    level: 'warning' as const,
    message: '黄色提醒：未验证站点请求钱包操作，先核对域名再连接。',
    skillRef: 'Skill §1.1 · 钓鱼 DApp',
  },
  unlimited_approve: {
    level: 'danger' as const,
    message: '红色拦截建议：无限额度授权可能长期动用你的代币。',
    skillRef: 'Skill §2.2 · 无限 Approve → Danger',
  },
  similar_address: {
    level: 'warning' as const,
    message: '地址检查：收款地址与历史记录高度相似，请完整核对或使用地址簿。',
    skillRef: 'Skill §1.2 · 地址投毒',
  },
  task_level_up: {
    level: 'info' as const,
    message: '护盾升级：又完成一项安全任务，离「安全护照」更近一步。',
  },
  mnemonic_phishing: {
    level: 'block' as const,
    message: '极高风险：任何索要助记词的页面都是骗局，立即关闭。',
    skillRef: 'Skill §1.3 · 要求助记词 → Block',
  },
} satisfies Record<
  string,
  { level: RiskLevel; message: string; skillRef?: string }
>

export function createShieldPulse(
  key: keyof typeof SHIELD_FEEDBACK,
): ShieldPulse {
  const item = SHIELD_FEEDBACK[key]
  return {
    level: item.level,
    message: item.message,
    skillRef: 'skillRef' in item ? item.skillRef : undefined,
    at: Date.now(),
  }
}

/** Skill §1.2 地址尾号相似检测 */
export function sharesAddressTail(candidate: string, reference: string): boolean {
  const a = candidate.trim().toLowerCase()
  const b = reference.trim().toLowerCase()
  if (!a.startsWith('0x') || !b.startsWith('0x') || a.length < 10 || b.length < 10) {
    return false
  }
  if (a === b) return false
  return a.slice(0, 6) === b.slice(0, 6) && a.slice(-4) === b.slice(-4)
}

export function findSimilarAddressWarning(
  recipient: string,
  references: string[],
): string | null {
  const r = recipient.trim().toLowerCase()
  if (!r.startsWith('0x') || r.length < 42) return null
  for (const ref of references) {
    if (sharesAddressTail(r, ref) && r !== ref.toLowerCase()) {
      return `收款地址与「${ref.slice(0, 6)}…${ref.slice(-4)}」首尾相似但中段不同，可能是地址投毒。`
    }
  }
  return null
}
