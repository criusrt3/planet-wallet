import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Copy,
  ExternalLink,
  History,
  Layers,
  RefreshCw,
  Send,
  Shield,
} from 'lucide-react'
import { PlanetVisualization } from '@/components/PlanetVisualization'
import { WalletPageLockScreen } from '@/components/WalletPageLockScreen'
import {
  explorerAddressUrl,
  FAUCET_LINKS,
  getChainById,
} from '@/lib/chains'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import type { TokenBalanceView } from '@/types'
import { Button } from '@repo/ui/components/button'
import { AssetRow } from '@repo/ui/components/asset-row'
import { Badge } from '@repo/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
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

function groupByChain(balances: TokenBalanceView[]) {
  const map = new Map<string, TokenBalanceView[]>()
  for (const b of balances) {
    const list = map.get(b.chainId) ?? []
    list.push(b)
    map.set(b.chainId, list)
  }
  return [...map.entries()].map(([chainId, items]) => ({
    chainId,
    chainName: items[0]?.chainName ?? chainId,
    items,
  }))
}

export function PlanetHomePage() {
  const navigate = useNavigate()
  const {
    wallet,
    balances,
    balancesLoading,
    refreshBalances,
    markAddressCopied,
    settings,
    isWalletPageUnlocked,
    lockWalletPage,
  } = useWallet()
  const [copied, setCopied] = useState(false)

  const chainGroups = useMemo(() => groupByChain(balances), [balances])
  const enabledChainIds = wallet?.enabledChainIds ?? ['sepolia']

  useEffect(() => {
    if (!wallet) navigate('/create')
  }, [wallet, navigate])

  useEffect(() => {
    if (settings.walletLockEnabled) lockWalletPage()
    return () => {
      if (settings.walletLockEnabled) lockWalletPage()
    }
  }, [settings.walletLockEnabled, lockWalletPage])

  if (!wallet) return null

  if (settings.walletLockEnabled && !isWalletPageUnlocked) {
    return <WalletPageLockScreen />
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(wallet!.address)
    setCopied(true)
    markAddressCopied()
    setTimeout(() => setCopied(false), 2000)
  }

  const ethBalance = balances.find(
    (b) => b.chainId === 'sepolia' && b.tokenId === 'eth',
  )

  return (
    <div className="space-y-5 animate-fade-up">
      {enabledChainIds.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {enabledChainIds.map((id) => {
            const c = getChainById(id)
            return (
              <Badge key={id} variant="primary" className="text-[10px]">
                {c?.shortName ?? id}
              </Badge>
            )
          })}
        </div>
      )}

      <PlanetVisualization
        interactive
        title={wallet.nickname}
        subtitle={
          ethBalance
            ? `${ethBalance.formatted} ${ethBalance.symbol} · Sepolia`
            : 'Sepolia 测试网'
        }
      />
      <div className="text-center -mt-1">
        {wallet.note ? (
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {wallet.note}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => handleCopy()}
          className="app-mono mt-1.5 inline-flex items-center gap-1 text-primary hover:underline"
          title={wallet.address}
        >
          {shortenAddress(wallet.address, 10)}
          <Copy className="h-3.5 w-3.5 shrink-0" />
        </button>
        {copied && (
          <p className="text-xs text-success-text mt-1">已复制完整地址</p>
        )}
        <a
          href={explorerAddressUrl('sepolia', wallet.address)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          在 Sepolia 浏览器查看
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">我的资产</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/assets" aria-label="管理多链资产">
                <Layers className="h-4 w-4" />
              </Link>
            </Button>
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {balancesLoading && balances.length === 0 ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : chainGroups.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              尚未添加任何链，
              <Link to="/assets" className="text-primary hover:underline">
                去添加多链资产
              </Link>
            </p>
          ) : (
            chainGroups.map((group) => {
              const chain = getChainById(group.chainId)
              return (
                <div
                  key={group.chainId}
                  className="border-t border-border first:border-t-0"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/40">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {group.chainName}
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      {chain?.chainId}
                    </Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {group.items.map((b) => (
                      <AssetRow
                        key={b.id}
                        avatar={
                          <TokenAvatar symbol={b.symbol} color={b.color} />
                        }
                        symbol={b.symbol}
                        amount={b.name}
                        value={`${Number.parseFloat(b.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 })}`}
                        detail={b.isNative ? '原生 gas' : 'ERC-20'}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {ethBalance && Number.parseFloat(ethBalance.formatted) < 0.001 && (
        <Card className="border-warning-border bg-warning-surface">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-warning-text">
              Sepolia 余额不足？先领取测试币
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

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link to="/assets">
          <Layers className="mr-2 h-4 w-4" />
          添加 / 管理多链资产
        </Link>
      </Button>

      <div className="flex gap-2 text-xs">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/security">
            <Shield className="mr-1 h-3.5 w-3.5 inline" />
            安全监测
          </Link>
        </Button>
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

      <p className="text-center text-xs text-muted-foreground">
        新手任务请到底部「任务」页完成
      </p>
    </div>
  )
}
