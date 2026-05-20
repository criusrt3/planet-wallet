import { useNavigate } from 'react-router-dom'
import { Download, Share2 } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { ShieldBadge } from '@/components/ShieldBadge'
import { Button } from '@/components/ui/Button'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { SHIELD_COPY } from '@/lib/security'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'

export function PassportPage() {
  const navigate = useNavigate()
  const {
    wallet,
    shieldLevel,
    completedTasks,
    manifesto,
    resetDemo,
  } = useWallet()

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
      <div
        id="passport-card"
        className="relative overflow-hidden rounded-2xl border-2 border-primary/40 p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(17,29,74,0.95) 0%, rgba(76,29,149,0.4) 50%, rgba(0,76,153,0.5) 100%)',
        }}
      >
        <div className="absolute right-4 top-4 text-4xl opacity-30">🪐</div>
        <p className="text-xs tracking-widest text-ai-text uppercase">
          imToken 10 周年 · 链上护照
        </p>
        <h2 className="mt-2 text-2xl font-bold">{wallet.nickname}</h2>
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
        <blockquote className="mt-6 border-l-2 border-ai-primary pl-3 text-sm italic text-foreground/90 whitespace-pre-line">
          {manifesto}
        </blockquote>
        <p className="mt-4 text-[10px] text-muted-foreground">
          本地纪念卡 · 非链上 NFT · 私钥从未离开本设备
        </p>
      </div>
      <ShieldBadge level={shieldLevel} />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4 inline" />
          分享护照
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            alert('请使用系统截图功能保存护照卡片')
          }}
        >
          <Download className="mr-2 h-4 w-4 inline" />
          保存提示
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={() => navigate('/planet')}>
        返回星球首页
      </Button>
      <Button variant="ghost" size="sm" onClick={resetDemo}>
        重置 Demo（清除本地数据）
      </Button>
    </div>
  )
}
