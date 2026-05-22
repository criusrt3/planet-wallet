import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ExternalLink,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { SUPPORTED_CHAINS } from '@/lib/chains'
import {
  RISK_LEVEL_LABEL,
  scanAddressSecurity,
  type AddressSecurityReport,
} from '@/lib/address-security'
import { useWallet } from '@/store/WalletContext'
import { shortenAddress } from '@/lib/wallet'
import type { RiskLevel } from '@/types'
import { Badge } from '@repo/ui/components/badge'
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

const RISK_ICON: Record<RiskLevel, typeof Shield> = {
  info: ShieldCheck,
  warning: Shield,
  danger: ShieldAlert,
  block: ShieldAlert,
}

const RISK_BADGE: Record<RiskLevel, 'primary' | 'neutral' | 'secondary'> = {
  info: 'primary',
  warning: 'secondary',
  danger: 'secondary',
  block: 'secondary',
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export function SecurityScanPage() {
  const [searchParams] = useSearchParams()
  const { wallet, addressBook } = useWallet()
  const [chainId, setChainId] = useState('sepolia')
  const [address, setAddress] = useState(
    () => searchParams.get('address') ?? wallet?.address ?? '',
  )

  useEffect(() => {
    const q = searchParams.get('address')
    if (q) setAddress(q)
  }, [searchParams])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AddressSecurityReport | null>(null)

  async function handleScan() {
    setError(null)
    setLoading(true)
    setReport(null)
    try {
      const result = await scanAddressSecurity(address.trim(), chainId)
      setReport(result)
      toast.success('扫描完成', {
        description: RISK_LEVEL_LABEL[result.riskLevel],
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '扫描失败'
      setError(msg)
      toast.error('扫描失败', { description: msg })
    } finally {
      setLoading(false)
    }
  }

  const RiskIcon = report ? RISK_ICON[report.riskLevel] : Shield

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-title-sm font-bold">安全监测</h2>
      </div>

      <p className="text-sm text-muted-foreground">
        输入任意地址，查看 Sepolia 上的交易规模与近期交互；危险交互按{' '}
        <span className="font-medium text-foreground">Security Skill</span>{' '}
        四档规则（授权、未知合约、地址尾号碰撞、附言钓鱼等）逐笔解读。
      </p>

      <OperationLearning scene="security_scan" compact />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">地址扫描</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>网络</Label>
            <Select value={chainId} onValueChange={setChainId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAINS.filter((c) => c.id === 'sepolia').map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scan-addr">地址</Label>
            <Input
              id="scan-addr"
              className="font-mono text-sm"
              placeholder="0x…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {wallet && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddress(wallet.address)}
              >
                当前身份
              </Button>
            )}
            {addressBook.slice(0, 3).map((e) => (
              <Button
                key={e.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddress(e.address)}
              >
                {e.label}
              </Button>
            ))}
          </div>

          <Button
            className="w-full"
            disabled={loading || !address.trim()}
            onClick={() => void handleScan()}
          >
            <Search className="mr-2 h-4 w-4" />
            {loading ? '正在分析链上数据…' : '开始安全扫描'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {report && (
        <>
          <Card
            className={
              report.riskLevel === 'block' || report.riskLevel === 'danger'
                ? 'border-destructive/50'
                : report.riskLevel === 'warning'
                  ? 'border-warning-border'
                  : ''
            }
          >
            <CardContent className="flex gap-3 p-4">
              <RiskIcon
                className={`h-10 w-10 shrink-0 ${
                  report.riskLevel === 'info'
                    ? 'text-primary'
                    : 'text-warning-text'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {RISK_LEVEL_LABEL[report.riskLevel]}
                  </span>
                  <Badge variant={RISK_BADGE[report.riskLevel]}>
                    风险分 {report.riskScore}
                  </Badge>
                  <Badge variant="neutral" className="text-[10px]">
                    Security Skill
                  </Badge>
                  {report.isScamFlagged && (
                    <Badge variant="secondary">可疑标记</Badge>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {report.skillEngine}
                </p>
                <p className="mt-1 text-sm">{report.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {report.aiAdvice}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">链上概况</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-xs break-all">{report.address}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatCell
                  label="交易总数（约）"
                  value={
                    report.totalTxCount !== null
                      ? report.totalTxCount.toLocaleString()
                      : '—'
                  }
                />
                <StatCell
                  label="发出交易数"
                  value={report.outgoingTxCount.toLocaleString()}
                />
                <StatCell
                  label="代币转账次数"
                  value={
                    report.tokenTransferCount !== null
                      ? report.tokenTransferCount.toLocaleString()
                      : '—'
                  }
                />
                <StatCell label="ETH 余额" value={report.balanceEth.slice(0, 10)} />
                <StatCell
                  label="近期授权笔数"
                  value={String(report.approveCount)}
                />
                <StatCell
                  label="近期合约交互"
                  value={String(report.contractCallCount)}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="neutral">
                  {report.isContract ? '合约地址' : '普通账户'}
                </Badge>
                {report.reputation && (
                  <Badge variant="neutral">声誉 {report.reputation}</Badge>
                )}
                <Badge variant="neutral">
                  交互对象 {report.uniqueCounterparties} 个（样本内）
                </Badge>
              </div>
              <a
                href={report.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                在区块浏览器查看完整历史
                <ExternalLink className="h-3 w-3" />
              </a>
              <p className="text-[10px] text-muted-foreground">
                数据来源：{report.dataSourceNote} · {report.chainName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-text" />
                风险项
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.flags.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{f.title}</p>
                    {f.skillRuleId && (
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        {f.skillRuleId.replace('skill_', '§')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">近期交互（样本）</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {report.recentInteractions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  未能拉取近期交易明细（地址交易量过大或 API 限流）。请使用上方链接在浏览器中查看完整记录。
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {report.recentInteractions.map((tx) => (
                    <li key={tx.hash} className="p-4 space-y-1 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">
                          {tx.direction === 'in'
                            ? '收到'
                            : tx.direction === 'out'
                              ? '发出'
                              : '自转'}
                          {' · '}
                          {tx.method}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={
                              tx.skillRiskLevel === 'danger' ||
                              tx.skillRiskLevel === 'block'
                                ? 'secondary'
                                : 'neutral'
                            }
                            className="text-[10px]"
                          >
                            Skill · {tx.skillActionType}
                          </Badge>
                          {tx.isApprove && (
                            <Badge variant="secondary" className="text-[10px]">
                              授权
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        对方：{shortenAddress(tx.counterparty, 6)}（
                        {tx.counterpartyLabel}）
                      </p>
                      <p className="text-muted-foreground">
                        金额：{Number.parseFloat(tx.valueEth).toFixed(6)} ETH
                      </p>
                      <p className="text-foreground/90 leading-snug">
                        {tx.skillTranslation}
                      </p>
                      {tx.skillRuleId && (
                        <p className="text-[10px] text-muted-foreground">
                          {tx.skillNote}
                        </p>
                      )}
                      <a
                        href={tx.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-mono"
                      >
                        {shortenAddress(tx.hash, 8)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
