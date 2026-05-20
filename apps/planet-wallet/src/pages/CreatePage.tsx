import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OperationLearning } from '@/components/OperationLearning'
import { MAX_WALLETS } from '@/lib/storage'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/components/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

export function CreatePage() {
  const navigate = useNavigate()
  const { createWallet, wallets, canCreateWallet } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isFirst = wallets.length === 0

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      await createWallet()
      navigate('/planet', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <OperationLearning scene="create_wallet" compact />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isFirst ? '创建第一个身份' : '创建新身份'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            已创建 <strong>{wallets.length}</strong> / {MAX_WALLETS} 个身份钱包。
            每个身份拥有独立地址与余额。
          </p>
          <p>
            使用 Token Core 在 <strong>Sepolia 测试网</strong> 生成，可真实转账与查余额。
          </p>
        </CardContent>
      </Card>
      <Alert className="border-warning-border bg-warning-surface">
        <AlertTitle className="text-warning-text">活动安全提示</AlertTitle>
        <AlertDescription>
          请勿在录屏或 AI 对话中展示真实助记词。演示请使用专用测试钱包。
        </AlertDescription>
      </Alert>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        size="lg"
        className="w-full"
        disabled={loading || !canCreateWallet}
        onClick={handleCreate}
      >
        {loading
          ? '正在创建…'
          : canCreateWallet
            ? '✨ 生成新身份钱包'
            : `已达 ${MAX_WALLETS} 个上限`}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        返回欢迎页
      </Button>
    </div>
  )
}
