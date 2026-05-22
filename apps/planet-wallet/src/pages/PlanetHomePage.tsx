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
  const enabledChainIds = wallet?.enabledChainIds ?? ['sepolia']
  const [activeChainId, setActiveChainId] = useState(enabledChainIds[0] ?? 'sepolia')

  const activeBalances = useMemo(
    () => balances.filter((b) => b.chainId === activeChainId),
    [balances, activeChainId],
  )

  const activeChain = getChainById(activeChainId)

  useEffect(() => {
    if (!wallet) navigate('/create')
  }, [wallet, navigate])

  useEffect(() => {
    if (!enabledChainIds.includes(activeChainId)) {
      setActiveChainId(enabledChainIds[0] ?? 'sepolia')
    }
  }, [enabledChainIds, activeChainId])

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

  const nativeBalance = activeBalances.find((b) => b.isNative)

  return (
    <div className="space-y-5 animate-fade-up">
      <PlanetVisualization
        interactive
        title={wallet.nickname}
        subtitle={
          nativeBalance
            ? `${nativeBalance.formatted} ${nativeBalance.symbol} · ${activeChain?.shortName ?? activeChainId}`
            : `${activeChain?.shortName ?? '测试网'}`
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
          href={explorerAddressUrl(activeChainId, wallet.address)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          在 {activeChain?.shortName ?? '链'} 浏览器查看
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
          {enabledChainIds.length > 1 ? (
            <div
              className="asset-chain-tabs"
              role="tablist"
              aria-label="切换资产链"
            >
              {enabledChainIds.map((id) => {
                const chain = getChainById(id)
                const active = id === activeChainId
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`asset-chain-tab ${active ? 'asset-chain-tab--active' : ''}`}
                    onClick={() => setActiveChainId(id)}
                  >
                    <span
                      className="asset-chain-tab__dot"
                      style={{ background: chain?.themeColor ?? 'var(--primary)' }}
                      aria-hidden
                    />
                    {chain?.shortName ?? id}
                  </button>
                )
              })}
            </div>
          ) : enabledChainIds.length === 1 ? (
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{
                  background:
                    getChainById(enabledChainIds[0])?.themeColor ?? 'var(--primary)',
                }}
                aria-hidden
              />
              <span className="text-xs font-semibold text-muted-foreground">
                {getChainById(enabledChainIds[0])?.shortName ?? enabledChainIds[0]}
              </span>
              <Badge variant="neutral" className="text-[10px] ml-auto">
                {getChainById(enabledChainIds[0])?.chainId}
              </Badge>
            </div>
          ) : null}

          {balancesLoading && balances.length === 0 ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : enabledChainIds.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              尚未添加任何链，
              <Link to="/assets" className="text-primary hover:underline">
                去添加多链资产
              </Link>
            </p>
          ) : activeBalances.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              {activeChain?.shortName ?? activeChainId} 暂无余额数据，请稍后刷新
            </p>
          ) : (
            <div className="divide-y divide-border">
              {activeBalances.map((b) => (
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
          )}
        </CardContent>
      </Card>

      {activeChainId === 'sepolia' &&
        nativeBalance &&
        Number.parseFloat(nativeBalance.formatted) < 0.001 && (
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
