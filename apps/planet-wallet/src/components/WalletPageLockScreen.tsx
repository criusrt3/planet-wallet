import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { toast } from '@repo/ui/components/toast'

export function WalletPageLockScreen() {
  const { wallet, unlockWalletPage } = useWallet()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('请输入密码')
      return
    }
    setSubmitting(true)
    try {
      const ok = await unlockWalletPage(password)
      if (!ok) {
        toast.error('密码错误')
        setPassword('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-up flex min-h-[min(70dvh,32rem)] flex-col items-center justify-center px-2">
      <Card className="w-full max-w-sm border-primary/25 shadow-[var(--shadow-elevated)]">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-surface-blue/40">
              <LockKeyhole className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <h2 className="app-page-title text-title-md">钱包已上锁</h2>
            <p className="app-meta max-w-[16rem]">
              {wallet?.nickname
                ? `进入「${wallet.nickname}」需输入你在设置中开启的钱包页密码`
                : '请输入设置中的钱包页密码以继续'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="wallet-lock-password">密码</Label>
              <Input
                id="wallet-lock-password"
                type="password"
                autoComplete="current-password"
                placeholder="输入钱包页密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? '验证中…' : '解锁并进入'}
            </Button>
          </form>

          <p className="app-meta text-center">
            忘记密码？可在
            <Button variant="link" className="h-auto px-1 text-caption" asChild>
              <Link to="/settings">设置</Link>
            </Button>
            关闭此功能或清除本地数据后重建。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
