import { useNavigate } from 'react-router-dom'
import { AiNavigator } from '@/components/AiNavigator'
import { PlanetVisualization } from '@/components/PlanetVisualization'
import { Button } from '@/components/ui/Button'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { useWallet } from '@/store/WalletContext'

export function WelcomePage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const msg = getNavigatorMessage('welcome')

  return (
    <div className="animate-fade-up space-y-6">
      <PlanetVisualization pulse />
      <AiNavigator message={msg.text} />
      <ul className="glass-card space-y-2 p-4 text-sm text-muted-foreground">
        <li>✦ 私钥 / 助记词仅在本地生成，不上传服务器</li>
        <li>✦ AI 在每次签名前翻译风险含义</li>
        <li>✦ 完成 5 个新手任务，领取链上护照纪念卡</li>
      </ul>
      {wallet ? (
        <Button size="lg" onClick={() => navigate('/planet')}>
          进入我的星球
        </Button>
      ) : (
        <Button size="lg" onClick={() => navigate('/create')}>
          点亮我的钱包星球
        </Button>
      )}
    </div>
  )
}
