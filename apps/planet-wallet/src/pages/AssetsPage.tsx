import { Link } from 'react-router-dom'
import { Layers, Plus } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { useRequireWallet } from '@/hooks/use-require-wallet'
import { SUPPORTED_CHAINS } from '@/lib/chains'
import { useWallet } from '@/store/WalletContext'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Switch } from '@repo/ui/components/switch'
import { toast } from '@repo/ui/components/toast'

export function AssetsPage() {
  const { wallet, missing } = useRequireWallet()
  const { setWalletChainEnabled, refreshBalances } = useWallet()

  if (missing || !wallet) return null

  function toggleChain(chainId: string, checked: boolean) {
    setWalletChainEnabled(chainId, checked)
    void refreshBalances()
    const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId)
    toast.success(
      checked ? `已添加 ${chain?.shortName} 资产` : `已隐藏 ${chain?.shortName}`,
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-primary" />
        <h2 className="text-title-sm font-bold">多链资产</h2>
      </div>

      <OperationLearning scene="switch_wallet" compact />

      <p className="text-sm text-muted-foreground">
        同一身份地址可在多条 EVM 测试网查询余额。开启后可在首页「我的资产」顶部切换链查看；转账与
        Swap 仍使用 Sepolia。
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加测试链
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {SUPPORTED_CHAINS.map((chain) => {
            const on = (wallet.enabledChainIds ?? ['sepolia']).includes(chain.id)
            return (
              <div
                key={chain.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ background: chain.themeColor }}
                    />
                    <span className="font-medium">{chain.shortName}</span>
                    <Badge variant="neutral" className="text-[10px]">
                      {chain.chainId}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chain.name} · {chain.tokens.length} 种资产
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground font-mono truncate">
                    {chain.tokens.map((t) => t.symbol).join(' · ')}
                  </p>
                </div>
                <Switch
                  checked={on}
                  onCheckedChange={(v) => toggleChain(chain.id, v)}
                  aria-label={`${chain.shortName} 资产`}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Button className="w-full" asChild>
        <Link to="/planet">返回星球首页</Link>
      </Button>
    </div>
  )
}
