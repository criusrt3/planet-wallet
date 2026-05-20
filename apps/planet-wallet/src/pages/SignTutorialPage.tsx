import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, FileSignature, Shield, Send } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { OperationLearning } from '@/components/OperationLearning'
import { WalletRequestSheet } from '@/components/WalletRequestSheet'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import {
  analyzeSignRequest,
  getDemoSignAnalysis,
  QUIZ_QUESTIONS,
} from '@/lib/security'
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
import { Label } from '@repo/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group'
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
  const { wallet, runDemoSign, demoSignature, submitQuiz, quizPassed } =
    useWallet()
  const [signing, setSigning] = useState(false)
  const [tab, setTab] = useState<DemoTab>('sign')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [demoApproveDone, setDemoApproveDone] = useState(false)
  const [demoTxDone, setDemoTxDone] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>(
    QUIZ_QUESTIONS.map(() => -1),
  )
  const [quizError, setQuizError] = useState(false)

  const actionType = TAB_ACTION[tab]
  const analysis =
    tab === 'sign' ? getDemoSignAnalysis() : analyzeSignRequest(actionType)

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

  if (!wallet) {
    navigate('/create')
    return null
  }

  async function handleSheetConfirm() {
    if (tab === 'sign') {
      setSigning(true)
      try {
        await runDemoSign()
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
    if (tab === 'approve') {
      setDemoApproveDone(true)
      toast.success('已模拟完成授权确认', {
        description: '教学演示未广播交易。真实场景请核对额度后再点确认。',
      })
    } else {
      setDemoTxDone(true)
      toast.success('已模拟完成转账确认', {
        description: '教学演示未广播交易。真实转账请在「转账」页操作。',
      })
    }
  }

  function handleQuizSubmit() {
    const ok = submitQuiz(quizAnswers)
    setQuizError(!ok)
    if (ok) navigate('/passport')
  }

  const tabDone =
    (tab === 'sign' && !!demoSignature) ||
    (tab === 'approve' && demoApproveDone) ||
    (tab === 'tx' && demoTxDone)

  return (
    <div className="space-y-4 animate-fade-up">
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
                {tabDone && (
                  <span className="inline-flex items-center gap-1 text-xs text-success-text">
                    <CheckCircle2 className="size-3.5" />
                    已确认
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                来自 <span className="font-medium text-foreground">{TUTORIAL_DAPP.name}</span>
                ，与连接 dApp 后弹出的钱包确认窗一致。请先查看完整字段，再点「拒绝」或「确认」。
              </p>
              {!tabDone && (
                <Button
                  size="lg"
                  className="w-full"
                  variant={tab === 'sign' ? 'default' : 'secondary'}
                  onClick={() => setSheetOpen(true)}
                >
                  查看请求并确认
                </Button>
              )}
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

          {tab === 'approve' && demoApproveDone && (
            <Card>
              <CardContent className="p-3">
                <AiNavigator
                  message="你已练习过「无限额度授权」的确认流程。真实场景中，这类请求建议拒绝或改为精确额度。"
                  compact
                />
              </CardContent>
            </Card>
          )}

          {tab === 'tx' && demoTxDone && (
            <Card>
              <CardContent className="p-3">
                <AiNavigator
                  message="转账前请逐项核对收款地址与金额。测试网真实转账请使用底部「转账」入口。"
                  compact
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <WalletRequestSheet
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

      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-semibold">
            {quizPassed ? '护盾问答已完成' : '开启护盾 · 安全问答'}
          </h3>
          {!quizPassed &&
            QUIZ_QUESTIONS.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm mb-2">{q.question}</p>
                <RadioGroup
                  value={
                    (quizAnswers[qi] ?? -1) >= 0 ? String(quizAnswers[qi]) : ''
                  }
                  onValueChange={(v) => {
                    const next = [...quizAnswers]
                    next[qi] = Number(v)
                    setQuizAnswers(next)
                  }}
                >
                  {q.options.map((opt, oi) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                      <Label htmlFor={`${q.id}-${oi}`} className="text-xs">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          {!quizPassed && (
            <>
              {quizError && (
                <p className="text-xs text-destructive">
                  还有题目答错了，再想想～
                </p>
              )}
              <Button
                disabled={quizAnswers.some((a) => a < 0)}
                onClick={handleQuizSubmit}
              >
                提交并升级护盾
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
