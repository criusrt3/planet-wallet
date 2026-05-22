import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownUp, ExternalLink, Info, RefreshCw } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { useRequireWallet } from '@/hooks/use-require-wallet'
import { isUserCancelled } from '@/lib/confirm-action'
import { explorerTxUrl, getTokenById, SEPOLIA_TOKENS } from '@/lib/chains'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { toast } from '@repo/ui/components/toast'

export function SwapPage() {
  const { wallet, missing } = useRequireWallet()
  const {
    balances,
    balancesLoading,
    refreshBalances,
    sendSwap,
    lastTxHash,
  } = useWallet()
  const [fromId, setFromId] = useState('eth')
  const [toId, setToId] = useState('usdc')
  const [amount, setAmount] = useState('')
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'idle' | 'approve' | 'swap'>('idle')

  if (missing || !wallet) return null

  const from = balances.find((b) => b.id === fromId)
  const toToken = getTokenById(toId)
  const needsApprove = fromId !== 'eth'

  function flipPair() {
    setFromId(toId)
    setToId(fromId)
    setAmount('')
    setError(null)
  }

  async function handleSwap() {
    setError(null)
    setSwapping(true)
    setStep(needsApprove ? 'approve' : 'swap')
    try {
      const result = await sendSwap({
        fromTokenId: fromId,
        toTokenId: toId,
        amountIn: amount.trim(),
      })
      if (result.approveHash) {
        toast.success('授权已上链', {
          description: '正在执行兑换…',
        })
      }
      toast.success('兑换已广播', {
        description: result.swapHash.slice(0, 14) + '…',
      })
      setAmount('')
      setStep('idle')
    } catch (e) {
      if (isUserCancelled(e)) return
      const msg = e instanceof Error ? e.message : '兑换失败'
      setError(msg)
      toast.error('兑换失败', { description: msg })
      setStep('idle')
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="h-5 w-5 text-primary" />
          <h2 className="text-title-sm font-bold">兑换（Swap）</h2>
        </div>
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

      <OperationLearning
        scene="swap"
        actionType={step === 'approve' ? 'approve' : 'swap'}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uniswap V3 · Sepolia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>支付</Label>
            <Select
              value={fromId}
              onValueChange={(v) => {
                setFromId(v)
                if (v === toId) setToId(SEPOLIA_TOKENS.find((t) => t.id !== v)?.id ?? 'usdc')
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_TOKENS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {from && (
              <p className="text-xs text-muted-foreground">
                余额：{from.formatted} {from.symbol}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <Button type="button" variant="outline" size="sm" onClick={flipPair}>
              ⇅ 切换方向
            </Button>
          </div>

          <div className="space-y-2">
            <Label>获得</Label>
            <Select value={toId} onValueChange={setToId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_TOKENS.filter((t) => t.id !== fromId).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>数量</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={swapping || !amount.trim()}
            onClick={() => void handleSwap()}
          >
            {swapping
              ? step === 'approve'
                ? '授权中…'
                : '兑换中…'
              : needsApprove
                ? '授权并兑换'
                : '确认兑换'}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          测试网演示：通过 Uniswap SwapRouter 执行 exactInputSingle。
          ERC-20 会先授权；若池子流动性不足会提示换交易对或小额度。
          无滑点保护（amountOutMinimum=0），请勿在主网使用此逻辑。
        </AlertDescription>
      </Alert>

      {lastTxHash && (
        <a
          href={explorerTxUrl('sepolia', lastTxHash)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
        >
          查看最近交易
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/history">查看全部操作记录</Link>
      </Button>
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
