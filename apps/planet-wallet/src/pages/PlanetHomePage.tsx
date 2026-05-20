import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, ExternalLink, History, RefreshCw, Send } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { PlanetVisualization } from '@/components/PlanetVisualization'
import { ShieldBadge } from '@/components/ShieldBadge'
import { TaskList } from '@/components/TaskList'
import { WalletSwitcher } from '@/components/WalletSwitcher'
import {
  explorerAddressUrl,
  FAUCET_LINKS,
  SEPOLIA_CHAIN_ID,
} from '@/lib/chains'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { revealMnemonic, shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { AssetRow } from '@repo/ui/components/asset-row'
import { Badge } from '@repo/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Skeleton } from '@repo/ui/components/skeleton'

function TokenAvatar({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: color }}
    >
      {symbol.slice(0, 3)}
    </div>
  )
}

export function PlanetHomePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    wallet,
    shieldLevel,
    completedTasks,
    navigatorText,
    balances,
    balancesLoading,
    refreshBalances,
    markBackupViewed,
    markAddressCopied,
  } = useWallet()
  const [showBackup, setShowBackup] = useState(false)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [backupLoading, setBackupLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!wallet) navigate('/create')
  }, [wallet, navigate])

  useEffect(() => {
    if (searchParams.get('openBackup') === '1' && wallet) {
      void openBackup()
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅响应 URL 参数
  }, [searchParams.get('openBackup'), wallet?.id])

  if (!wallet) return null

  async function handleCopy() {
    await navigator.clipboard.writeText(wallet!.address)
    setCopied(true)
    markAddressCopied()
    setTimeout(() => setCopied(false), 2000)
  }

  async function openBackup() {
    setShowBackup(true)
    markBackupViewed()
    setBackupLoading(true)
    try {
      const phrase = await revealMnemonic(
        wallet!.keystoreJson,
        wallet!.walletPassword,
      )
      setMnemonic(phrase)
    } catch {
      setMnemonic('导出失败，请重置 Demo 后重试')
    } finally {
      setBackupLoading(false)
    }
  }

  const allDone = completedTasks.length >= 5
  const ethBalance = balances.find((b) => b.id === 'eth')

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <WalletSwitcher />
        <div className="flex gap-2">
          <Badge variant="primary">Sepolia</Badge>
          <Badge variant="neutral">ID {SEPOLIA_CHAIN_ID}</Badge>
        </div>
      </div>

      <PlanetVisualization />
      <div className="text-center">
        <p className="text-title-sm font-bold">{wallet.nickname}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
          title={wallet.address}
        >
          {wallet.address}
          <Copy className="h-3.5 w-3.5 shrink-0" />
        </button>
        {copied && (
          <p className="text-xs text-success-text mt-1">已复制完整地址</p>
        )}
        <a
          href={explorerAddressUrl(wallet.address)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          在 Etherscan 查看
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">我的资产</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void refreshBalances()}
            disabled={balancesLoading}
            aria-label="刷新余额"
          >
            <RefreshCw
              className={`h-4 w-4 ${balancesLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {balancesLoading && balances.length === 0 ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            balances.map((b) => (
              <AssetRow
                key={b.id}
                avatar={<TokenAvatar symbol={b.symbol} color={b.color} />}
                symbol={b.symbol}
                amount={b.name}
                value={`${Number.parseFloat(b.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
                detail={b.isNative ? '原生 gas' : 'ERC-20'}
              />
            ))
          )}
        </CardContent>
      </Card>

      {ethBalance && Number.parseFloat(ethBalance.formatted) < 0.001 && (
        <Card className="border-warning-border bg-warning-surface">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-warning-text">
              余额不足？先领取测试币
            </p>
            <ul className="text-xs space-y-1">
              {FAUCET_LINKS.map((f) => (
                <li key={f.url}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {f.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button className="w-full" asChild>
          <Link to="/transfer">
            <Send className="mr-2 h-4 w-4" />
            转账
          </Link>
        </Button>
        <Button variant="secondary" className="w-full" asChild>
          <Link to="/swap">兑换</Link>
        </Button>
      </div>

      <ShieldBadge level={shieldLevel} />
      <AiNavigator message={navigatorText} compact />

      <div className="flex gap-2 text-xs">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/sign">签名教学</Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/address-book">地址本</Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/history">
            <History className="mr-1 h-3.5 w-3.5 inline" />
            记录
          </Link>
        </Button>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          新手任务 · {completedTasks.length}/5
        </h3>
        <TaskList
          completed={completedTasks}
          onBackup={openBackup}
          onCopyAddress={handleCopy}
        />
      </section>

      {allDone && (
        <Button className="w-full" onClick={() => navigate('/passport')}>
          领取 10 周年护照
        </Button>
      )}

      <Dialog open={showBackup} onOpenChange={setShowBackup}>
        <DialogContent className="max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-warning-text">
              星球钥匙 · 请手写备份
            </DialogTitle>
          </DialogHeader>
          <AiNavigator message={getNavigatorMessage('backup').text} compact />
          {backupLoading ? (
            <p className="text-sm text-muted-foreground">正在解密助记词…</p>
          ) : (
            <p className="rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed break-words">
              {mnemonic}
            </p>
          )}
          <Alert variant="destructive">
            <AlertDescription>
              仅用于 Sepolia 测试网体验，请勿向此地址转入主网资产。
            </AlertDescription>
          </Alert>
          <Button className="w-full" onClick={() => setShowBackup(false)}>
            我已抄写保存
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
