import { Copy } from 'lucide-react'
import { WalletRequestSheet } from '@/components/WalletRequestSheet'
import { analyzeSignRequest } from '@/lib/security'
import { TUTORIAL_DAPP } from '@/lib/tutorial-requests'
import { shortenAddress } from '@/lib/wallet'
import { toast } from '@repo/ui/components/toast'

interface TaskAddressSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address: string
  onCopied: () => void
}

/** 模拟转账前核对收款地址的钱包确认窗 */
export function TaskAddressSheet({
  open,
  onOpenChange,
  address,
  onCopied,
}: TaskAddressSheetProps) {
  const analysis = analyzeSignRequest('eth_sendTransaction')

  async function handleConfirm() {
    await navigator.clipboard.writeText(address)
    onCopied()
    toast.success('已复制完整地址', {
      description: '大额转账前请与收款方核对每一位字符',
    })
    onOpenChange(false)
  }

  return (
    <WalletRequestSheet
      open={open}
      onOpenChange={onOpenChange}
      title="核对收款地址"
      dappName="星球钱包 · 地址本"
      dappOrigin="planet-wallet://address-book"
      fields={[
        { label: '网络', value: 'Ethereum Sepolia' },
        { label: '你的地址', value: address, mono: true },
        {
          label: '操作',
          value: '复制完整 0x 地址到剪贴板',
          highlight: 'warning',
        },
        {
          label: '提示',
          value: '不要只看前 6 位和后 4 位，警惕地址投毒',
        },
      ]}
      analysis={{
        ...analysis,
        aiTranslation:
          '确认后将复制完整地址。请与收款方逐字核对，勿从历史记录盲目粘贴相似地址。',
        riskLevel: 'warning',
      }}
      confirmLabel="复制并确认"
      demoOnly
      onConfirm={handleConfirm}
    />
  )
}

export function AddressPreviewRow({ address }: { address: string }) {
  return (
    <p className="font-mono text-center text-sm text-primary break-all">
      {shortenAddress(address, 12)}
      <Copy className="inline ml-1 h-3 w-3" />
    </p>
  )
}
