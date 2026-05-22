import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Pencil, Settings, User } from 'lucide-react'
import { OperationLearning } from '@/components/OperationLearning'
import { shortenAddress } from '@/lib/wallet'
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
import { Switch } from '@repo/ui/components/switch'
import { Textarea } from '@repo/ui/components/textarea'
import { toast } from '@repo/ui/components/toast'

export function SettingsPage() {
  const {
    wallet,
    wallets,
    activeWalletId,
    settings,
    setShowLearningHints,
    updateWalletProfile,
    resetDemo,
  } = useWallet()

  const [editingId, setEditingId] = useState(activeWalletId ?? '')
  const [nickname, setNickname] = useState('')
  const [note, setNote] = useState('')

  const editingWallet = wallets.find((w) => w.id === editingId) ?? wallet

  useEffect(() => {
    if (activeWalletId) setEditingId(activeWalletId)
  }, [activeWalletId])

  useEffect(() => {
    if (editingWallet) {
      setNickname(editingWallet.nickname)
      setNote(editingWallet.note ?? '')
    }
  }, [editingWallet?.id, editingWallet?.nickname, editingWallet?.note])

  function handleSaveProfile() {
    if (!editingWallet) return
    const trimmed = nickname.trim()
    if (!trimmed) {
      toast.error('名称不能为空')
      return
    }
    if (trimmed.length > 32) {
      toast.error('名称最多 32 个字符')
      return
    }
    updateWalletProfile(editingWallet.id, { nickname: trimmed, note })
    toast.success('已保存', {
      description:
        editingWallet.id === activeWalletId
          ? '当前身份名称与备注已更新'
          : `已更新「${trimmed}」`,
    })
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-title-sm font-bold">设置</h2>
      </div>

      {wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              身份名称与备注
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wallets.length > 1 && (
              <div className="space-y-2">
                <Label>编辑哪个身份</Label>
                <Select value={editingId} onValueChange={setEditingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择身份" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.nickname}
                        {w.id === activeWalletId ? '（当前）' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {editingWallet && (
              <>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">链上地址</Label>
                  <p className="font-mono text-xs break-all text-primary">
                    {editingWallet.address}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {shortenAddress(editingWallet.address, 8)} · 地址不可修改
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-nickname">身份名称</Label>
                  <Input
                    id="wallet-nickname"
                    value={nickname}
                    maxLength={32}
                    placeholder="例如：活动演示钱包"
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    显示在首页、身份切换与护照上，最多 32 字
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-note">备注（可选）</Label>
                  <Textarea
                    id="wallet-note"
                    value={note}
                    maxLength={200}
                    rows={3}
                    placeholder="例如：仅用于 Sepolia 测试、活动 Day1 演示…"
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    仅保存在本机，不上传；最多 200 字
                  </p>
                </div>

                <Button className="w-full" onClick={handleSaveProfile}>
                  <Pencil className="mr-2 h-4 w-4" />
                  保存名称与备注
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {wallets.length === 0 && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            尚未创建身份钱包，
            <Button variant="link" className="h-auto p-0" asChild>
              <Link to="/task/light_planet">去点亮星球</Link>
            </Button>
          </CardContent>
        </Card>
      )}

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
            身份钱包、地址本、名称备注与设置均保存在本机浏览器，不上传服务器。
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

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to={wallet ? '/planet' : '/'}>返回</Link>
      </Button>
    </div>
  )
}
