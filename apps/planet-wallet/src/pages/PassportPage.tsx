import { useNavigate } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { ShieldBadge } from '@/components/ShieldBadge'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { SHIELD_COPY } from '@/lib/security'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'

export function PassportPage() {
  const navigate = useNavigate()
  const { wallet, shieldLevel, completedTasks, manifesto, resetDemo } =
    useWallet()

  if (!wallet) {
    navigate('/create')
    return null
  }

  const created = new Date(wallet.createdAt).toLocaleString('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const shield = SHIELD_COPY[shieldLevel]

  function handleShare() {
    const text = `【星球钱包 · 10 周年链上护照】\n${wallet!.nickname}\n${shortenAddress(wallet!.address, 6)}\n护盾：${shield.label}\n任务：${completedTasks.length}/5\n\n${manifesto}`
    if (navigator.share) {
      navigator.share({ title: '星球钱包护照', text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      alert('护照文案已复制，可粘贴分享')
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <AiNavigator message={getNavigatorMessage('passport').text} compact />
      <Card
        id="passport-card"
        className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-brand-deep/90 via-ai-subtle-bg/30 to-surface-blue/40"
      >
        <CardContent className="p-6 relative">
          <span className="absolute right-4 top-4 text-4xl opacity-30">🪐</span>
          <p className="text-xs tracking-widest text-ai-text uppercase">
            imToken 10 周年 · 链上护照
          </p>
          <h2 className="mt-2 text-title-md font-bold">{wallet.nickname}</h2>
          <p className="font-mono text-sm text-primary mt-1">
            {shortenAddress(wallet.address, 8)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">创建时间</dt>
              <dd className="font-medium">{created}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">完成任务</dt>
              <dd className="font-medium">{completedTasks.length} / 5</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">护盾等级</dt>
              <dd className={`font-semibold ${shield.color}`}>{shield.label}</dd>
            </div>
          </dl>
          <blockquote className="mt-6 border-l-2 border-ai-primary pl-3 text-sm italic whitespace-pre-line">
            {manifesto}
          </blockquote>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Token Core WASM · 本地纪念卡 · 非链上 NFT
          </p>
        </CardContent>
      </Card>
      <ShieldBadge level={shieldLevel} />
      <Button size="lg" className="w-full" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        分享护照
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigate('/planet')}>
        返回星球首页
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void resetDemo()}>
        重置 Demo（清除本地数据）
      </Button>
    </div>
  )
}
