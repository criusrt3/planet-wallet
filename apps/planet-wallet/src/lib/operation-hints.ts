import type { OperationScene } from '@/types'

const HINTS: Record<OperationScene, string> = {
  create_wallet:
    '每个身份都是独立的链上账户。创建后请备份助记词，并只在测试网领取资产。',
  switch_wallet:
    '切换身份会更换当前地址与余额视图。转账前请确认选中的是你要用的那个身份。',
  transfer:
    '转账会把资产发送到收款地址，链上无法撤回。请从地址本选择可信联系人，并核对完整地址。',
  swap:
    'Swap 是用一种代币换另一种，通常需要先授权（Approve）路由器合约。授权额度越大，被盗风险越高。',
  sign:
    '签名可能是登录确认，也可能关联资产操作。看清提示再点确认。',
  approve:
    '授权允许合约在未来动用你的代币。无限额度授权非常危险，建议只授权本次所需。',
  address_book_add:
    '地址本帮你保存常用联系人。仍要在转账前核对完整地址，避免地址尾号碰撞诈骗。',
  address_book_use:
    '从地址本填入地址可以减少手输错误，但请再次确认显示的是完整 0x 地址。',
}

export function getOperationHint(scene: OperationScene): string {
  return HINTS[scene] ?? '操作前请确认你理解这一步的含义。'
}
