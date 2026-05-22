import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, FileSignature, Shield, Send } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { OperationLearning } from '@/components/OperationLearning'
import { TaskReplayShell } from '@/components/TaskReplayShell'
import { WalletRequestSheet } from '@/components/WalletRequestSheet'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { analyzeSignRequest, getDemoSignAnalysis } from '@/lib/security'
import { nextTaskId } from '@/lib/tasks'
import {
  TUTORIAL_DAPP,
  buildTutorialApproveFields,
  buildTutorialSignFields,
  buildTutorialTxFields,
} from '@/lib/tutorial-requests'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { toast } from '@repo/ui/components/toast'
import type { SignActionType } from '@/types'

type DemoTab = 'sign' | 'approve' | 'tx'

const TAB_ACTION: Record<DemoTab, SignActionType> = {
  sign: 'personal_sign',
  approve: 'approve',
  tx: 'eth_sendTransaction',
}

const TAB_CONFIRM_LABEL: Record<DemoTab, string> = {
  sign: '签名',
  approve: '确认授权',
  tx: '确认转账',
}

const TAB_SHEET_TITLE: Record<DemoTab, string> = {
  sign: '签名请求',
  approve: '代币授权',
  tx: '转账确认',
}

export function SignTutorialPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const autoSheet = searchParams.get('autoSheet') as DemoTab | null
  const {
    wallet,
    runDemoSign,
    demoSignature,
    completedTasks,
    emitShieldPulse,
    completeTask,
  } = useWallet()
  const [signing, setSigning] = useState(false)
  const [tab, setTab] = useState<DemoTab>(
    autoSheet === 'approve' || autoSheet === 'tx' ? autoSheet : 'sign',
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [session, setSession] = useState(0)

  const taskDone = completedTasks.includes('first_sign')

  const actionType = TAB_ACTION[tab]
  const analysis = useMemo(() => {
    if (tab === 'sign') return getDemoSignAnalysis()
    const base = analyzeSignRequest(actionType)
    if (tab === 'approve') {
      return {
        ...base,
        riskLevel: 'danger' as const,
        canProceed: false,
        aiTranslation:
          '这是高风险授权：对方请求「无限制」使用你的 USDT。Security Skill 建议拒绝或改为精确额度。',
        detail:
          '无限 Approve 后合约可随时转走代币。教学演示中确认按钮已禁用，真实场景也应优先拒绝。',
      }
    }
    return base
  }, [tab, actionType])

  const nextChallenge = nextTaskId(completedTasks)

  const requestFields = useMemo(() => {
    if (!wallet) return []
    switch (tab) {
      case 'sign':
        return buildTutorialSignFields(wallet.address)
      case 'approve':
        return buildTutorialApproveFields()
      case 'tx':
        return buildTutorialTxFields(wallet.address)
    }
  }, [tab, wallet])

  useEffect(() => {
    if (autoSheet && ['sign', 'approve', 'tx'].includes(autoSheet)) {
      setTab(autoSheet)
      const t = setTimeout(() => setSheetOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [autoSheet, session])

  if (!wallet) {
    navigate('/create')
    return null
  }

  function openSheet() {
    if (tab === 'approve') {
      emitShieldPulse({
        level: 'danger',
        message: '红色拦截建议：检测到无限额度授权请求，建议拒绝。',
        skillRef: 'Skill §2.2 · 无限 Approve',
        at: Date.now(),
      })
    }
    setSheetOpen(true)
  }

  async function handleSheetConfirm() {
    if (tab === 'sign') {
      setSigning(true)
      try {
        await runDemoSign()
        if (!taskDone) completeTask('first_sign')
        setSheetOpen(false)
        toast.success('签名已完成', {
          description: '这是一次真实的 Demo 消息签名（不上链、不花 Gas）',
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : '签名失败'
        toast.error('签名失败', { description: msg })
      } finally {
        setSigning(false)
      }
      return
    }

    setSheetOpen(false)
    toast.success('已拒绝 / 关闭演示', {
      description: '教学演示未广播交易。高风险授权请勿确认。',
    })
  }

  function replay() {
    setSession((s) => s + 1)
    setSheetOpen(false)
    setTimeout(() => setSheetOpen(true), 300)
  }

  return (
    <TaskReplayShell
      title="第一次安全签名"
      done={taskDone}
      onReplay={replay}
    >
      <OperationLearning scene="sign" actionType={actionType} compact />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as DemoTab)
          setSheetOpen(false)
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="sign" className="flex-1 gap-1">
            <FileSignature className="size-3.5" />
            登录签名
          </TabsTrigger>
          <TabsTrigger value="tx" className="flex-1 gap-1">
            <Send className="size-3.5" />
            转账示例
          </TabsTrigger>
          <TabsTrigger value="approve" className="flex-1 gap-1">
            <Shield className="size-3.5" />
            授权示例
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3 mt-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">待处理请求</p>
                  <p className="text-sm font-semibold">{TAB_SHEET_TITLE[tab]}</p>
                </div>
                {tab === 'sign' && demoSignature && (
                  <span className="inline-flex items-center gap-1 text-xs text-success-text">
                    <CheckCircle2 className="size-3.5" />
                    已签过
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                来自 <span className="font-medium text-foreground">{TUTORIAL_DAPP.name}</span>
                ，与连接 dApp 后从底部滑出的钱包确认窗一致。
              </p>
              <Button size="lg" className="w-full" onClick={openSheet}>
                打开钱包确认弹窗
              </Button>
            </CardContent>
          </Card>

          {tab === 'sign' && demoSignature && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs text-success-text">tcx-wasm 签名结果</p>
                <p className="font-mono text-[10px] break-all text-muted-foreground">
                  {demoSignature.slice(0, 80)}…
                </p>
                <AiNavigator
                  message={getNavigatorMessage('sign_done').text}
                  compact
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <WalletRequestSheet
        key={session}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={TAB_SHEET_TITLE[tab]}
        dappName={TUTORIAL_DAPP.name}
        dappOrigin={TUTORIAL_DAPP.origin}
        fields={requestFields}
        analysis={analysis}
        confirmLabel={TAB_CONFIRM_LABEL[tab]}
        loading={signing}
        demoOnly={tab !== 'sign'}
        onConfirm={handleSheetConfirm}
      />

      {nextChallenge &&
        nextChallenge !== 'first_sign' &&
        nextChallenge !== 'security_passport' && (
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/challenge/${nextChallenge}`}>继续实战任务 →</Link>
          </Button>
        )}
      {nextChallenge === 'security_passport' && (
        <Button variant="outline" className="w-full" asChild>
          <Link to="/passport?openQuiz=1">前往生成安全护照 →</Link>
        </Button>
      )}
    </TaskReplayShell>
  )
}
