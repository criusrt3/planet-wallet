import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, LockKeyhole, Palette, Pencil, Settings, User } from 'lucide-react'
import { getThemeStatusLabel, THEME_OPTIONS } from '@/lib/theme'
import { OperationLearning } from '@/components/OperationLearning'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'

function SettingsFieldGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className ?? 'flex flex-col gap-2.5'}>{children}</div>
  )
}

function SettingsAccordionSection({
  value,
  icon: Icon,
  title,
  children,
}: {
  value: string
  icon: ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="border-0">
      <Card className="overflow-hidden py-0">
        <AccordionTrigger className="min-h-[3.25rem] px-5 py-4 hover:no-underline [&>svg]:mt-1 [&>svg]:text-muted-foreground">
          <span className="flex items-center gap-2.5 text-base font-medium leading-snug">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            {title}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-0 pb-0 [&>div]:pb-0">
          <CardContent className="settings-accordion-body flex flex-col gap-5 border-t border-border/50 px-5 pt-5 pb-6">
            {children}
          </CardContent>
        </AccordionContent>
      </Card>
    </AccordionItem>
  )
}

export function SettingsPage() {
  const {
    wallet,
    wallets,
    activeWalletId,
    settings,
    setTheme,
    setShowLearningHints,
    updateWalletProfile,
    enableWalletPageLock,
    disableWalletPageLock,
    changeWalletPageLockPassword,
    lockWalletPage,
    resetDemo,
  } = useWallet()

  const [editingId, setEditingId] = useState(activeWalletId ?? '')
  const [nickname, setNickname] = useState('')
  const [note, setNote] = useState('')

  const [setupLockOpen, setSetupLockOpen] = useState(false)
  const [disableLockOpen, setDisableLockOpen] = useState(false)
  const [changeLockOpen, setChangeLockOpen] = useState(false)
  const [newLockPassword, setNewLockPassword] = useState('')
  const [confirmLockPassword, setConfirmLockPassword] = useState('')
  const [currentLockPassword, setCurrentLockPassword] = useState('')
  const [changeLockPassword, setChangeLockPassword] = useState('')
  const [changeLockConfirm, setChangeLockConfirm] = useState('')

  function clearLockForm() {
    setNewLockPassword('')
    setConfirmLockPassword('')
    setCurrentLockPassword('')
    setChangeLockPassword('')
    setChangeLockConfirm('')
  }

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

  async function handleEnableLock() {
    if (newLockPassword !== confirmLockPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    const ok = await enableWalletPageLock(newLockPassword)
    if (!ok) {
      toast.error('密码至少 4 位')
      return
    }
    clearLockForm()
    setSetupLockOpen(false)
    toast.success('已开启钱包页密码', {
      description: '下次进入「钱包」Tab 需输入密码',
    })
  }

  async function handleDisableLock() {
    if (!currentLockPassword) {
      toast.error('请输入当前密码')
      return
    }
    const ok = await disableWalletPageLock(currentLockPassword)
    if (!ok) {
      toast.error('当前密码错误')
      return
    }
    clearLockForm()
    setDisableLockOpen(false)
    toast.success('已关闭钱包页密码')
  }

  async function handleChangeLockPassword() {
    if (changeLockPassword !== changeLockConfirm) {
      toast.error('两次新密码不一致')
      return
    }
    const ok = await changeWalletPageLockPassword(
      currentLockPassword,
      changeLockPassword,
    )
    if (!ok) {
      toast.error('当前密码错误或新密码不符合要求')
      return
    }
    clearLockForm()
    setChangeLockOpen(false)
    toast.success('密码已更新', { description: '钱包页已重新上锁' })
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="app-page-title">设置</h2>
      </div>

      <Accordion type="multiple" className="space-y-4">
        <SettingsAccordionSection value="theme" icon={Palette} title="外观主题">
          <p className="app-meta">
            当前为「{getThemeStatusLabel(settings.theme)}」。主题保存在本机，跟随系统时会随系统深浅色自动更新。
          </p>
          <div className="theme-options-grid">
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`theme-option ${active ? 'theme-option--active' : ''}`}
                  onClick={() => {
                    if (!active) {
                      setTheme(opt.id)
                      toast.success(`已切换为${opt.label}`)
                    }
                  }}
                >
                  <span
                    className="theme-option__swatch"
                    data-preview={opt.id}
                    aria-hidden
                  />
                  <span className="theme-option__label">{opt.label}</span>
                  <span className="theme-option__desc">{opt.description}</span>
                </button>
              )
            })}
          </div>
        </SettingsAccordionSection>

        {wallets.length > 0 && (
          <SettingsAccordionSection
            value="profile"
            icon={User}
            title="身份名称与备注"
          >
            {wallets.length > 1 && (
              <SettingsFieldGroup>
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
              </SettingsFieldGroup>
            )}

            {editingWallet && (
              <>
                <SettingsFieldGroup className="flex flex-col gap-1.5">
                  <Label className="text-muted-foreground">链上地址</Label>
                  <p className="app-mono break-all text-primary leading-relaxed">
                    {editingWallet.address}
                  </p>
                  <p className="app-meta !mt-1">
                    {shortenAddress(editingWallet.address, 8)} · 地址不可修改
                  </p>
                </SettingsFieldGroup>

                <SettingsFieldGroup>
                  <Label htmlFor="wallet-nickname">身份名称</Label>
                  <Input
                    id="wallet-nickname"
                    value={nickname}
                    maxLength={32}
                    placeholder="例如：活动演示钱包"
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <p className="app-meta !mt-0.5">
                    显示在首页、身份切换与护照上，最多 32 字
                  </p>
                </SettingsFieldGroup>

                <SettingsFieldGroup>
                  <Label htmlFor="wallet-note">备注（可选）</Label>
                  <Textarea
                    id="wallet-note"
                    value={note}
                    maxLength={200}
                    rows={3}
                    placeholder="例如：仅用于 Sepolia 测试、活动 Day1 演示…"
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <p className="app-meta !mt-0.5">
                    仅保存在本机，不上传；最多 200 字
                  </p>
                </SettingsFieldGroup>

                <Button className="w-full" onClick={handleSaveProfile}>
                  <Pencil className="mr-2 h-4 w-4" />
                  保存名称与备注
                </Button>
              </>
            )}
          </SettingsAccordionSection>
        )}

        {wallets.length === 0 && (
          <SettingsAccordionSection value="profile-empty" icon={User} title="身份名称与备注">
            <p className="text-sm text-muted-foreground">
              尚未创建身份钱包，
              <Button variant="link" className="h-auto p-0" asChild>
                <Link to="/task/light_planet">去点亮星球</Link>
              </Button>
            </p>
          </SettingsAccordionSection>
        )}

        <SettingsAccordionSection value="learning" icon={BookOpen} title="学习提示">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="hints" className="leading-snug">
                操作时显示讲解
              </Label>
              <p className="text-xs text-muted-foreground leading-[1.6]">
                关闭后，转账、Swap、签名等页面不再显示 AI 导航与风险翻译。你随时可以再打开。
              </p>
            </div>
            <Switch
              id="hints"
              className="mt-0.5 shrink-0"
              checked={settings.showLearningHints}
              onCheckedChange={setShowLearningHints}
            />
          </div>
          {settings.showLearningHints && (
            <div className="pt-1">
              <OperationLearning scene="transfer" actionType="eth_sendTransaction" compact />
            </div>
          )}
        </SettingsAccordionSection>

        <SettingsAccordionSection
          value="wallet-lock"
          icon={LockKeyhole}
          title="钱包页密码"
        >
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="wallet-lock-switch" className="leading-snug">
                进入钱包页时需要密码
              </Label>
              <p className="text-xs text-muted-foreground leading-[1.6]">
                {settings.walletLockEnabled
                  ? '已开启 · 密码仅保存在本机'
                  : '关闭中 · 打开开关可设置密码'}
              </p>
            </div>
            <Switch
              id="wallet-lock-switch"
              className="mt-0.5 shrink-0"
              checked={settings.walletLockEnabled}
              onCheckedChange={(checked) => {
                if (checked) setSetupLockOpen(true)
                else setDisableLockOpen(true)
              }}
            />
          </div>

          {settings.walletLockEnabled && (
            <div className="flex flex-wrap gap-2.5 border-t border-border/40 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangeLockOpen(true)}
              >
                修改密码
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  lockWalletPage()
                  toast.info('钱包页已锁定')
                }}
              >
                立即锁定
              </Button>
            </div>
          )}
        </SettingsAccordionSection>
      </Accordion>

      <Dialog
        open={setupLockOpen}
        onOpenChange={(open) => {
          setSetupLockOpen(open)
          if (!open) clearLockForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>设置钱包页密码</DialogTitle>
            <DialogDescription>
              每次进入底部「钱包」页前需输入此密码。密码以哈希形式仅存于本机浏览器。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-lock-pw">密码</Label>
              <Input
                id="new-lock-pw"
                type="password"
                autoComplete="new-password"
                placeholder="至少 4 位"
                value={newLockPassword}
                onChange={(e) => setNewLockPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-lock-pw">确认密码</Label>
              <Input
                id="confirm-lock-pw"
                type="password"
                autoComplete="new-password"
                placeholder="再次输入"
                value={confirmLockPassword}
                onChange={(e) => setConfirmLockPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSetupLockOpen(false)
                clearLockForm()
              }}
            >
              取消
            </Button>
            <Button onClick={() => void handleEnableLock()}>确认开启</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableLockOpen}
        onOpenChange={(open) => {
          setDisableLockOpen(open)
          if (!open) setCurrentLockPassword('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>关闭钱包页密码</DialogTitle>
            <DialogDescription>请输入当前密码以关闭此功能。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disable-lock-pw">当前密码</Label>
            <Input
              id="disable-lock-pw"
              type="password"
              autoComplete="current-password"
              value={currentLockPassword}
              onChange={(e) => setCurrentLockPassword(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDisableLockOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDisableLock()}
            >
              确认关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={changeLockOpen}
        onOpenChange={(open) => {
          setChangeLockOpen(open)
          if (!open) clearLockForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改钱包页密码</DialogTitle>
            <DialogDescription>修改后钱包页将重新上锁。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="change-current-pw">当前密码</Label>
              <Input
                id="change-current-pw"
                type="password"
                autoComplete="current-password"
                value={currentLockPassword}
                onChange={(e) => setCurrentLockPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-new-pw">新密码</Label>
              <Input
                id="change-new-pw"
                type="password"
                autoComplete="new-password"
                placeholder="至少 4 位"
                value={changeLockPassword}
                onChange={(e) => setChangeLockPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-confirm-pw">确认新密码</Label>
              <Input
                id="change-confirm-pw"
                type="password"
                autoComplete="new-password"
                value={changeLockConfirm}
                onChange={(e) => setChangeLockConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setChangeLockOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleChangeLockPassword()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <p className="text-sm font-medium leading-snug">数据与隐私</p>
          <p className="text-xs text-muted-foreground leading-[1.6]">
            身份钱包、地址本、名称备注、钱包页密码与设置均保存在本机浏览器，不上传服务器。
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void resetDemo()}
          >
            清除全部本地数据
          </Button>
          <p className="app-meta">
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
