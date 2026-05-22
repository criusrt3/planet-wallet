import { Link } from 'react-router-dom'
import {
  ArrowDownUp,
  CheckCircle2,
  ExternalLink,
  FileSignature,
  KeyRound,
  Send,
  Shield,
  Trash2,
} from 'lucide-react'
import { useRequireWallet } from '@/hooks/use-require-wallet'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import type { TxHistoryType } from '@/types'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Badge } from '@repo/ui/components/badge'

const TYPE_LABEL: Record<TxHistoryType, string> = {
  transfer: '转账',
  swap: '兑换',
  approve: '授权',
  sign: '签名',
  create_wallet: '创建钱包',
}

const TYPE_ICON: Record<TxHistoryType, typeof Send> = {
  transfer: Send,
  swap: ArrowDownUp,
  approve: Shield,
  sign: FileSignature,
  create_wallet: KeyRound,
}

export function HistoryPage() {
  const { wallet, missing } = useRequireWallet()
  const { txHistory, clearTxHistory } = useWallet()

  if (missing || !wallet) return null

  const myHistory = txHistory.filter((h) => h.walletId === wallet.id)

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-title-sm font-bold">链上操作记录</h2>
        {myHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void clearTxHistory()}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            清空
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        转账、授权、兑换、签名等操作成功后会自动记录在此（本地存储，最多 200 条）。
      </p>

      {myHistory.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            暂无记录。完成一笔转账或兑换后会出现在这里。
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {myHistory.map((entry) => {
            const Icon = TYPE_ICON[entry.type]
            return (
              <li key={entry.id}>
                <Card>
                  <CardContent className="flex gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{entry.title}</span>
                        <Badge variant="neutral" className="text-[10px]">
                          {TYPE_LABEL[entry.type]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {entry.summary}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.hash ? (
                        <a
                          href={entry.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {shortenAddress(entry.hash, 10)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : entry.explorerUrl ? (
                        <a
                          href={entry.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          在 Etherscan 查看
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs text-success-text">
                          <CheckCircle2 className="h-3 w-3" />
                          已完成
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
