/** 用户主动取消敏感操作（非错误） */
export const USER_CANCELLED = 'USER_CANCELLED'

export function isUserCancelled(error: unknown): boolean {
  return error instanceof Error && error.message === USER_CANCELLED
}

export function cancelSensitiveAction(): never {
  throw new Error(USER_CANCELLED)
}

export type SensitiveActionKey =
  | 'reset_all_data'
  | 'remove_wallet'
  | 'clear_tx_history'
  | 'remove_address_book_entry'
  | 'send_transfer'
  | 'send_swap'

const MESSAGES: Record<
  SensitiveActionKey,
  { title: string; body: string; confirmLabel?: string }
> = {
  reset_all_data: {
    title: '清除全部本地数据',
    body: '将删除本机所有身份钱包、地址本、任务进度与操作记录，且无法恢复。',
    confirmLabel: '确认清除',
  },
  remove_wallet: {
    title: '删除身份钱包',
    body: '将永久删除该身份的本地密钥与记录。未备份助记词将无法找回，链上资产仍在该地址。',
    confirmLabel: '确认删除',
  },
  clear_tx_history: {
    title: '清空操作记录',
    body: '将删除当前身份的全部本地操作历史，不影响链上交易与钱包本身。',
    confirmLabel: '确认清空',
  },
  remove_address_book_entry: {
    title: '删除地址本条目',
    body: '将从本地地址本移除此联系人，不影响链上数据。',
    confirmLabel: '确认删除',
  },
  send_transfer: {
    title: '确认转账',
    body: '交易广播后无法撤销，请核对收款地址与金额。',
    confirmLabel: '确认转账',
  },
  send_swap: {
    title: '确认兑换',
    body: '将签名并广播 Swap 交易（可能包含代币授权），请核对交易对与数量。',
    confirmLabel: '确认兑换',
  },
}

export function getSensitiveActionCopy(
  action: SensitiveActionKey,
  detail?: string,
) {
  const msg = MESSAGES[action]
  return {
    title: msg.title,
    body: msg.body,
    detail: detail?.trim() || undefined,
    confirmLabel: msg.confirmLabel ?? '确定继续',
  }
}

type ConfirmHandler = (
  action: SensitiveActionKey,
  detail?: string,
) => Promise<boolean>

let confirmHandler: ConfirmHandler | null = null

export function registerSensitiveConfirm(handler: ConfirmHandler | null): void {
  confirmHandler = handler
}

/**
 * 敏感操作二次确认（应用内弹窗）。未挂载 Provider 时回退到 window.confirm。
 */
export async function confirmSensitiveAction(
  action: SensitiveActionKey,
  detail?: string,
): Promise<boolean> {
  if (confirmHandler) {
    return confirmHandler(action, detail)
  }
  const { title, body, detail: d } = getSensitiveActionCopy(action, detail)
  const lines = [`【${title}】`, '', body]
  if (d) lines.push('', d)
  lines.push('', '确定继续？')
  return window.confirm(lines.join('\n'))
}
