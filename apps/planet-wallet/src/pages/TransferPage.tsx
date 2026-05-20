import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookUser, ExternalLink, Send } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { isUserCancelled } from '@/lib/confirm-action'
import { explorerTxUrl, getTokenById, SEPOLIA_TOKENS } from '@/lib/chains'
import { useWallet } from '@/store/WalletContext'
import { shortenAddress } from '@/lib/wallet'
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
import { toast } from '@repo/ui/components/toast'

export function TransferPage() {
  const navigate = useNavigate()
  const {
    wallet,
    balances,
    addressBook,
    sendTransfer,
    lastTxHash,
  } = useWallet()
  const [tokenId, setTokenId] = useState('eth')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!wallet) navigate('/create')
  }, [wallet, navigate])

  if (!wallet) return null

  const token = getTokenById(tokenId)
  const balance = balances.find((b) => b.id === tokenId)

  function pickFromAddressBook(entryId: string) {
    const entry = addressBook.find((e) => e.id === entryId)
    if (entry) {
      setTo(entry.address)
      toast.success(`已填入：${entry.label}`)
    }
  }

  async function handleSend() {
    setError(null)
    setSending(true)
    try {
      const hash = await sendTransfer({ tokenId, to: to.trim(), amount })
      toast.success('交易已广播到 Sepolia', {
        description: shortenAddress(hash, 8),
      })
      setAmount('')
    } catch (e) {
      if (isUserCancelled(e)) return
      const msg = e instanceof Error ? e.message : '转账失败'
      setError(msg)
      toast.error('转账失败', { description: msg })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <OperationLearning scene="transfer" actionType="eth_sendTransaction" compact />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">测试网转账</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/address-book">
              <BookUser className="mr-1 h-4 w-4" />
              地址本
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {addressBook.length > 0 && (
            <div className="space-y-2">
              <Label>从地址本选择</Label>
              <Select onValueChange={pickFromAddressBook}>
                <SelectTrigger>
                  <SelectValue placeholder="选择联系人" />
                </SelectTrigger>
                <SelectContent>
                  {addressBook.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label} · {shortenAddress(e.address, 4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>代币</Label>
            <Select value={tokenId} onValueChange={setTokenId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_TOKENS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol} · {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {balance && (
              <p className="text-xs text-muted-foreground">
                可用余额：{balance.formatted} {balance.symbol}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">收款地址</Label>
            <Input
              id="to"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">金额</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={sending || !to || !amount}
        onClick={handleSend}
      >
        <Send className="mr-2 h-4 w-4" />
        {sending ? '签名并广播中…' : `发送 ${token?.symbol ?? ''}`}
      </Button>

      {lastTxHash && (
        <Button variant="outline" className="w-full" asChild>
          <a
            href={explorerTxUrl(lastTxHash)}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            在 Etherscan 查看上一笔交易
          </a>
        </Button>
      )}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/history">查看操作记录</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
