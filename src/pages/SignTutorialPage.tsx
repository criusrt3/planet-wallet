import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiNavigator } from '@/components/AiNavigator'
import { SignTranslator } from '@/components/SignTranslator'
import { Button } from '@/components/ui/Button'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { analyzeSignRequest, getDemoSignAnalysis, QUIZ_QUESTIONS } from '@/lib/security'
import { getDemoMessage } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'

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
      <AiNavigator message={getNavigatorMessage('sign_intro').text} compact />
      <div className="flex gap-2 text-xs">
        {(
          [
            ['sign', '登录签名'],
            ['tx', '转账示例'],
            ['approve', '授权示例'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 ${tab === k ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <SignTranslator analysis={analysis} />
      {tab === 'sign' && (
        <>
          <div className="glass-card p-3">
            <p className="text-xs text-muted-foreground mb-1">待签名消息</p>
            <p className="text-sm">{getDemoMessage()}</p>
          </div>
          {demoSignature ? (
            <div className="glass-card p-3">
              <p className="text-xs text-success mb-1">签名结果（教学演示）</p>
              <p className="font-mono text-[10px] break-all text-muted-foreground">
                {demoSignature.slice(0, 66)}…
              </p>
              <AiNavigator
                message={getNavigatorMessage('sign_done').text}
                compact
              />
            </div>
          ) : (
            <Button
              size="lg"
              disabled={signing || !analysis.canProceed}
              onClick={handleSign}
            >
              {signing ? '签名中…' : '我理解了，开始 Demo 签名'}
            </Button>
          )}
        </>
      )}
      {tab !== 'sign' && (
        <p className="text-xs text-muted-foreground">
          以上为签名翻译器演示：MVP 不执行真实转账或授权，仅展示 AI 如何解释风险。
        </p>
      )}
      <section className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">
          {quizPassed ? '护盾问答已完成' : '开启护盾 · 安全问答'}
        </h3>
        {!quizPassed &&
          QUIZ_QUESTIONS.map((q, qi) => (
            <div key={q.id}>
              <p className="text-sm mb-2">{q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, oi) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={quizAnswers[qi] === oi}
                      onChange={() => {
                        const next = [...quizAnswers]
                        next[qi] = oi
                        setQuizAnswers(next)
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        {!quizPassed && (
          <>
            {quizError && (
              <p className="text-xs text-destructive">还有题目答错了，再想想～</p>
            )}
            <Button
              size="md"
              onClick={handleQuizSubmit}
              disabled={quizAnswers.some((a) => a < 0)}
            >
              提交并升级护盾
            </Button>
          </>
        )}
      </section>
    </div>
  )
}
