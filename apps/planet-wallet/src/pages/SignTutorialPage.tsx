import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiNavigator } from '@/components/AiNavigator'
import { OperationLearning } from '@/components/OperationLearning'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import {
  analyzeSignRequest,
  getDemoSignAnalysis,
  QUIZ_QUESTIONS,
} from '@/lib/security'
import { getDemoMessage } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs'
import { Label } from '@repo/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group'

type DemoTab = 'sign' | 'approve' | 'tx'

export function SignTutorialPage() {
  const navigate = useNavigate()
  const { wallet, runDemoSign, demoSignature, submitQuiz, quizPassed } =
    useWallet()
  const [signing, setSigning] = useState(false)
  const [tab, setTab] = useState<DemoTab>('sign')
  const [quizAnswers, setQuizAnswers] = useState<number[]>(
    QUIZ_QUESTIONS.map(() => -1),
  )
  const [quizError, setQuizError] = useState(false)

  if (!wallet) {
    navigate('/create')
    return null
  }

  const analysis =
    tab === 'sign'
      ? getDemoSignAnalysis()
      : analyzeSignRequest(
          tab === 'approve' ? 'approve' : 'eth_sendTransaction',
        )

  async function handleSign() {
    setSigning(true)
    try {
      await runDemoSign()
    } finally {
      setSigning(false)
    }
  }

  function handleQuizSubmit() {
    const ok = submitQuiz(quizAnswers)
    setQuizError(!ok)
    if (ok) navigate('/passport')
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <OperationLearning
        scene="sign"
        actionType={
          tab === 'sign'
            ? 'personal_sign'
            : tab === 'approve'
              ? 'approve'
              : 'eth_sendTransaction'
        }
        compact
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as DemoTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="sign" className="flex-1">
            登录签名
          </TabsTrigger>
          <TabsTrigger value="tx" className="flex-1">
            转账示例
          </TabsTrigger>
          <TabsTrigger value="approve" className="flex-1">
            授权示例
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="space-y-3 mt-3">
          {tab === 'sign' ? (
            <>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    待签名消息
                  </p>
                  <p className="text-sm">{getDemoMessage()}</p>
                </CardContent>
              </Card>
              {demoSignature ? (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs text-success-text">
                      tcx-wasm 签名结果
                    </p>
                    <p className="font-mono text-[10px] break-all text-muted-foreground">
                      {demoSignature.slice(0, 80)}…
                    </p>
                    <AiNavigator
                      message={getNavigatorMessage('sign_done').text}
                      compact
                    />
                  </CardContent>
                </Card>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={signing || !analysis.canProceed}
                  onClick={handleSign}
                >
                  {signing ? 'Token Core 签名中…' : '我理解了，开始 Demo 签名'}
                </Button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              签名翻译器演示：MVP 不执行真实转账或授权，仅展示 AI 风险解释。
            </p>
          )}
        </TabsContent>
      </Tabs>

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
