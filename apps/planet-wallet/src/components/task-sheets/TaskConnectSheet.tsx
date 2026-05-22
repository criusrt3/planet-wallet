import { Sparkles } from 'lucide-react'
import { WalletRequestSheet } from '@/components/WalletRequestSheet'
import { analyzeSignRequest } from '@/lib/security'
import { TUTORIAL_DAPP } from '@/lib/tutorial-requests'

interface TaskConnectSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasWallet: boolean
  onConnect: () => void
}

/** 模拟 dApp 请求连接 / 创建钱包 */
export function TaskConnectSheet({
  open,
  onOpenChange,
  hasWallet,
  onConnect,
}: TaskConnectSheetProps) {
  return (
    <WalletRequestSheet
      open={open}
      onOpenChange={onOpenChange}
      title="连接钱包"
      dappName={TUTORIAL_DAPP.name}
      dappOrigin={TUTORIAL_DAPP.origin}
      fields={[
        { label: '请求权限', value: '查看地址 · 请求签名' },
        { label: '网络', value: 'Ethereum Sepolia（测试网）' },
        {
          label: '说明',
          value: hasWallet
            ? '你已有点亮的星球，可前往身份管理查看'
            : '将为你生成第一个链上身份（本地 Keystore）',
        },
      ]}
      analysis={analyzeSignRequest('personal_sign')}
      confirmLabel={hasWallet ? '查看我的身份' : '创建并连接'}
      demoOnly
      onConfirm={() => {
        onConnect()
        onOpenChange(false)
      }}
    />
  )
}

export function DappConnectHint() {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      点击下方按钮，体验与真实钱包一致的底部弹窗
    </p>
  )
}
