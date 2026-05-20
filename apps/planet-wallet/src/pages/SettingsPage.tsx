import { Link } from 'react-router-dom'
import { BookOpen, Settings } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Label } from '@repo/ui/components/label'
import { Switch } from '@repo/ui/components/switch'

export function SettingsPage() {
  const { settings, setShowLearningHints, resetDemo } = useWallet()

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-title-sm font-bold">设置</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            学习提示
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="hints">操作时显示讲解</Label>
              <p className="text-xs text-muted-foreground">
                关闭后，转账、Swap、签名等页面不再显示 AI 导航与风险翻译。你随时可以再打开。
              </p>
            </div>
            <Switch
              id="hints"
              checked={settings.showLearningHints}
              onCheckedChange={setShowLearningHints}
            />
          </div>
          {settings.showLearningHints && (
            <OperationLearning scene="transfer" actionType="eth_sendTransaction" compact />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium">数据与隐私</p>
          <p className="text-xs text-muted-foreground">
            身份钱包、地址本、设置均保存在本机浏览器，不上传服务器。
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void resetDemo()}
          >
            清除全部本地数据
          </Button>
          <p className="text-[10px] text-muted-foreground">
            仅「操作记录」页的清空不会删除钱包；此处会删除全部身份。
          </p>
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" asChild>
        <Link to="/planet">返回钱包</Link>
      </Button>
    </div>
  )
}
