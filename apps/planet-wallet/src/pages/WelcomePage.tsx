import { useNavigate } from 'react-router-dom'
import { AiNavigator } from '@/components/AiNavigator'
import { HomeTasksPanel } from '@/components/HomeTasksPanel'
import { PlanetVisualization } from '@/components/PlanetVisualization'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'

export function WelcomePage() {
  const navigate = useNavigate()
  const { wallets } = useWallet()
  const hasWallet = wallets.length > 0
  const msg = getNavigatorMessage('welcome')

  if (hasWallet) {
    return <HomeTasksPanel />
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PlanetVisualization pulse />
      <AiNavigator message={msg.text} />
      <Card>
        <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
          <p>✦ 最多 10 个身份钱包，随时切换</p>
          <p>✦ 地址本 + Sepolia 真实转账</p>
          <p>✦ 操作时可学习，熟悉后可在设置关闭提示</p>
        </CardContent>
      </Card>
        <Button
          size="lg"
          className="w-full"
          onClick={() => navigate('/task/light_planet')}
        >
          点亮我的钱包星球
        </Button>
    </div>
  )
}
