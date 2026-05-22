import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { SignTranslator } from '@/components/SignTranslator'
import { TaskReplayShell } from '@/components/TaskReplayShell'
import { TaskPhishingBrowserSheet } from '@/components/task-sheets/TaskPhishingBrowserSheet'
import { WalletRequestSheet } from '@/components/WalletRequestSheet'
import { analyzeSignRequest, SECURITY_SKILL_REF } from '@/lib/security'
import { createShieldPulse } from '@/lib/shield-monitor'
import {
  TUTORIAL_DAPP,
  buildTutorialApproveFields,
  buildTutorialTxFields,
} from '@/lib/tutorial-requests'
import type { TaskId } from '@/types'
import { useWallet } from '@/store/WalletContext'
import { Alert, AlertDescription } from '@repo/ui/components/alert'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { toast } from '@repo/ui/components/toast'

const CHALLENGE_IDS = [
  'danger_approve',
  'fake_airdrop',
  'address_poison',
] as const

type ChallengeId = (typeof CHALLENGE_IDS)[number]

function isChallengeId(id: string | undefined): id is ChallengeId {
  return CHALLENGE_IDS.includes(id as ChallengeId)
}

const CHALLENGE_TITLE: Record<ChallengeId, string> = {
  danger_approve: '危险授权挑战',
  fake_airdrop: '假空投识别',
  address_poison: '地址投毒侦探',
}

export function SecurityChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>()
  const navigate = useNavigate()
  const { wallet, completeTask, emitShieldPulse, completedTasks } = useWallet()
  const [session, setSession] = useState(0)

  if (!wallet) {
    navigate('/create')
    return null
  }

  if (!isChallengeId(challengeId)) {
    navigate('/')
    return null
  }

  const done = completedTasks.includes(challengeId as TaskId)

  function passTask(id: TaskId) {
    if (!completedTasks.includes(id)) {
      completeTask(id)
      toast.success('任务完成', { description: CHALLENGE_TITLE[id as ChallengeId] })
    } else {
      toast.success('练习完成', { description: '可重复体验，进度已记录' })
    }
  }

  function replay() {
    setSession((s) => s + 1)
  }

  return (
    <div key={session} className="space-y-4">
      <p className="text-[10px] text-muted-foreground">{SECURITY_SKILL_REF}</p>
      {challengeId === 'danger_approve' && (
        <DangerApproveChallenge
          done={done}
          onPass={() => {
            passTask('danger_approve')
            emitShieldPulse(createShieldPulse('unlimited_approve'))
          }}
          onReplay={replay}
        />
      )}
      {challengeId === 'fake_airdrop' && (
        <FakeAirdropChallenge
          done={done}
          onPass={() => {
            passTask('fake_airdrop')
            emitShieldPulse(createShieldPulse('mnemonic_phishing'))
          }}
          onReplay={replay}
        />
      )}
      {challengeId === 'address_poison' && (
        <AddressPoisonChallenge
          walletAddress={wallet.address}
          done={done}
          onPass={() => {
            passTask('address_poison')
            emitShieldPulse(createShieldPulse('similar_address'))
          }}
          onReplay={replay}
        />
      )}
    </div>
  )
}

function DangerApproveChallenge({
  done,
  onPass,
  onReplay,
}: {
  done: boolean
  onPass: () => void
  onReplay: () => void
}) {
  const [picked, setPicked] = useState<'a' | 'b' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const approveAnalysis = useMemo(
    () => ({
      ...analyzeSignRequest('approve'),
      riskLevel: 'danger' as const,
      canProceed: false,
      aiTranslation:
        '无限额度授权：对方可在未来任意时刻转走你的 USDT，请拒绝或改为精确额度。',
    }),
    [],
  )
  const signAnalysis = analyzeSignRequest('personal_sign')

  function submit() {
    setRevealed(true)
    if (picked === 'b') onPass()
  }

  return (
    <TaskReplayShell title="危险授权挑战" done={done} onReplay={onReplay}>
      <AiNavigator
        message="先体验真实钱包里的「无限授权」弹窗，再判断哪一项更危险。"
        compact
      />
      <Button className="w-full" variant="secondary" onClick={() => setSheetOpen(true)}>
        打开「无限 Approve」钱包弹窗
      </Button>
      <WalletRequestSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="代币授权"
        dappName={TUTORIAL_DAPP.name}
        dappOrigin={TUTORIAL_DAPP.origin}
        fields={buildTutorialApproveFields()}
        analysis={approveAnalysis}
        confirmLabel="确认授权"
        demoOnly
        onConfirm={() => setSheetOpen(false)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">哪个更危险？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant={picked === 'a' ? 'default' : 'outline'}
            className="w-full h-auto py-3 text-left whitespace-normal"
            onClick={() => setPicked('a')}
          >
            A. 「登录网站」— Sign Message 身份确认
          </Button>
          <Button
            type="button"
            variant={picked === 'b' ? 'default' : 'outline'}
            className="w-full h-auto py-3 text-left whitespace-normal"
            onClick={() => setPicked('b')}
          >
            B. 「授权对方使用你的全部 USDT」— Unlimited Approve
          </Button>
          <Button className="w-full" disabled={!picked} onClick={submit}>
            提交答案
          </Button>
        </CardContent>
      </Card>

      {revealed && (
        <div className="space-y-3">
          {picked === 'b' ? (
            <Alert className="border-success-border bg-success-surface">
              <AlertDescription className="text-sm">
                正确！B 是代币授权，对方可在额度内（尤其是无限额度时）被动用资产。
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                A 通常是身份确认；B 的 Approve 才是新手最常踩的坑。
              </AlertDescription>
            </Alert>
          )}
          <SignTranslator analysis={signAnalysis} />
          <SignTranslator analysis={approveAnalysis} />
        </div>
      )}
      {done && (
        <p className="text-xs text-success-text flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> 已完成 · 可重复打开上方弹窗练习
        </p>
      )}
    </TaskReplayShell>
  )
}

function FakeAirdropChallenge({
  done,
  onPass,
  onReplay,
}: {
  done: boolean
  onPass: () => void
  onReplay: () => void
}) {
  const [picked, setPicked] = useState<'safe' | 'trap' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)

  function submit() {
    setRevealed(true)
    if (picked === 'trap') onPass()
  }

  return (
    <TaskReplayShell title="假空投识别" done={done} onReplay={onReplay}>
      <AiNavigator
        message="先打开模拟钓鱼网站（全屏浏览器层），再选出危险页面。"
        compact
      />
      <Button
        className="w-full"
        variant="destructive"
        onClick={() => setBrowserOpen(true)}
      >
        打开钓鱼空投网站（模拟）
      </Button>
      <TaskPhishingBrowserSheet
        open={browserOpen}
        onOpenChange={setBrowserOpen}
        onRecognizedPhishing={() => toast.info('已识别骗局', { description: '请继续完成下方选择题' })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          className={`cursor-pointer transition ${picked === 'safe' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setPicked('safe')}
        >
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">页面 A</p>
            <p className="font-semibold text-sm">🎁 Sepolia 测试空投</p>
            <p className="text-xs text-muted-foreground">
              连接钱包领取，无需助记词。
            </p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition border-destructive/40 ${picked === 'trap' ? 'ring-2 ring-destructive' : ''}`}
          onClick={() => setPicked('trap')}
        >
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> 页面 B
            </p>
            <p className="font-semibold text-sm">⚡ 限时领取 5000 USDT</p>
            <p className="text-xs text-muted-foreground">索要 12 个助记词。</p>
          </CardContent>
        </Card>
      </div>
      <Button className="w-full" disabled={!picked} onClick={submit}>
        我选好了
      </Button>
      {revealed && (
        <Alert
          className={
            picked === 'trap'
              ? 'border-success-border bg-success-surface'
              : 'border-danger-border bg-error-surface'
          }
        >
          <AlertDescription className="text-sm">
            {picked === 'trap'
              ? '正确！任何要求输入助记词的网站都应立即关闭。'
              : '页面 B 是典型钓鱼：用空投诱饵骗取助记词。'}
          </AlertDescription>
        </Alert>
      )}
    </TaskReplayShell>
  )
}

function AddressPoisonChallenge({
  walletAddress,
  done,
  onPass,
  onReplay,
}: {
  walletAddress: string
  done: boolean
  onPass: () => void
  onReplay: () => void
}) {
  const legit = walletAddress
  const poison = useMemo(() => {
    const chars = legit.split('')
    const mid = Math.max(10, Math.floor(chars.length / 2))
    chars[mid] = chars[mid]?.toLowerCase() === 'a' ? 'b' : 'a'
    return chars.join('')
  }, [legit])
  const displayA = `${legit.slice(0, 6)}…${legit.slice(-4)}`
  const displayB = `${poison.slice(0, 6)}…${poison.slice(-4)}`
  const [picked, setPicked] = useState<'a' | 'b' | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  const txFields = useMemo(
    () => [
      ...buildTutorialTxFields(legit).slice(0, 2),
      { label: '收款方', value: poison, mono: true, highlight: 'danger' as const },
      { label: '陷阱', value: `看似 ${displayB}，与真地址首尾相同`, highlight: 'warning' as const },
      { label: '转账金额', value: '1.0 ETH（演示）', highlight: 'warning' as const },
    ],
    [legit, poison, displayB],
  )

  function submit() {
    setRevealed(true)
    if (picked === 'b') onPass()
  }

  return (
    <TaskReplayShell title="地址投毒侦探" done={done} onReplay={onReplay}>
      <AiNavigator
        message="大额转账前会弹出确认窗。先体验弹窗，再找出投毒地址。"
        compact
      />
      <Button className="w-full" variant="secondary" onClick={() => setSheetOpen(true)}>
        打开「转账确认」钱包弹窗（含投毒地址）
      </Button>
      <WalletRequestSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="转账确认"
        dappName="Planet Quest"
        dappOrigin="https://quest.planet-wallet.demo"
        fields={txFields}
        analysis={{
          ...analyzeSignRequest('eth_sendTransaction'),
          aiTranslation:
            '收款地址与历史记录高度相似但中段不同！请展开完整 0x 地址核对，建议使用地址簿。',
          riskLevel: 'danger',
          canProceed: false,
        }}
        confirmLabel="确认转账"
        demoOnly
        onConfirm={() => setSheetOpen(false)}
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            真实地址：<span className="font-mono">{legit}</span>
          </p>
          <Button
            type="button"
            variant={picked === 'a' ? 'default' : 'outline'}
            className="w-full font-mono"
            onClick={() => setPicked('a')}
          >
            记录 A：{displayA}
          </Button>
          <Button
            type="button"
            variant={picked === 'b' ? 'default' : 'outline'}
            className="w-full font-mono"
            onClick={() => setPicked('b')}
          >
            记录 B：{displayB}
          </Button>
          <Button className="w-full" disabled={!picked} onClick={submit}>
            提交：哪条可能是投毒地址？
          </Button>
        </CardContent>
      </Card>
      {revealed && (
        <p className="text-sm">
          {picked === 'b'
            ? '正确！投毒地址首尾相似、中段不同——转账前必须核对完整地址。'
            : 'A 是真地址；B 是投毒示例。'}
        </p>
      )}
    </TaskReplayShell>
  )
}
