import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { MAX_WALLETS } from '@/lib/storage'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

export function WalletsPage() {
  const navigate = useNavigate()
  const {
    wallets,
    activeWalletId,
    switchWallet,
    removeWallet,
    canCreateWallet,
  } = useWallet()

  return (
    <div className="space-y-4 animate-fade-up">
      <h2 className="text-title-sm font-bold">身份钱包</h2>
      <p className="text-sm text-muted-foreground">
        最多 {MAX_WALLETS} 个独立身份，每个拥有独立地址与余额。
      </p>

      <OperationLearning scene="switch_wallet" compact />

      <div className="space-y-2">
        {wallets.map((w) => (
          <Card
            key={w.id}
            className={w.id === activeWalletId ? 'ring-2 ring-primary/50' : ''}
          >
            <CardContent className="flex items-center justify-between gap-2 p-4">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  switchWallet(w.id)
                  navigate('/planet')
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{w.nickname}</span>
                  {w.id === activeWalletId && (
                    <Badge variant="primary">当前</Badge>
                  )}
                </div>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {shortenAddress(w.address, 8)}
                </p>
              </button>
              {wallets.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="删除身份"
                  onClick={() => void removeWallet(w.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {canCreateWallet ? (
        <Button size="lg" className="w-full" asChild>
          <Link to="/create">
            <Plus className="mr-2 h-4 w-4" />
            创建新身份
          </Link>
        </Button>
      ) : (
        <p className="text-sm text-warning-text text-center">
          已达 {MAX_WALLETS} 个身份上限
        </p>
      )}

      <Button variant="ghost" size="sm" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
