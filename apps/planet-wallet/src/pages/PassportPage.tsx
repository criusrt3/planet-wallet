import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, ImageIcon, Loader2, Share2 } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { ShieldBadge } from '@/components/ShieldBadge'
import { TaskPassportQuizSheet } from '@/components/task-sheets/TaskPassportQuizSheet'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import {
  captureElementAsPng,
  downloadBlob,
  safePassportFilename,
} from '@/lib/passport-capture'
import { SHIELD_COPY, QUIZ_QUESTIONS } from '@/lib/security'
import { TOTAL_TASKS } from '@/lib/tasks'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { toast } from '@repo/ui/components/toast'

export function PassportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const passportCardRef = useRef<HTMLDivElement>(null)
  const {
    wallet,
    shieldLevel,
    completedTasks,
    manifesto,
    resetDemo,
    submitQuiz,
    quizPassed,
    completeTask,
  } = useWallet()
  const [quizAnswers, setQuizAnswers] = useState<number[]>(
    QUIZ_QUESTIONS.map(() => -1),
  )
  const [quizError, setQuizError] = useState(false)
  const [quizSheetOpen, setQuizSheetOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (searchParams.get('openQuiz') === '1') {
      setQuizSheetOpen(true)
    }
  }, [searchParams])

  if (!wallet) {
    navigate('/create')
    return null
  }

  const created = new Date(wallet.createdAt).toLocaleString('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
  const shield = SHIELD_COPY[shieldLevel]
  const passportDone = completedTasks.includes('security_passport')

  function buildShareText() {
    return `【星球钱包 · 10 周年链上护照】\n${wallet!.nickname}\n${shortenAddress(wallet!.address, 6)}\n护盾：${shield.label}\n任务：${completedTasks.length}/${TOTAL_TASKS}\n\n${manifesto}`
  }

  async function generatePassportImage(): Promise<Blob | null> {
    const el = passportCardRef.current
    if (!el) {
      toast.error('未找到护照卡片')
      return null
    }
    setCapturing(true)
    try {
      return await captureElementAsPng(el)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '截图失败'
      toast.error('生成护照图片失败', { description: msg })
      return null
    } finally {
      setCapturing(false)
    }
  }

  async function handleSaveImage() {
    const blob = await generatePassportImage()
    if (!blob || !wallet) return
    downloadBlob(blob, safePassportFilename(wallet.nickname))
    toast.success('护照图片已保存', {
      description: '已下载 PNG，可直接发朋友圈或活动群',
    })
  }

  async function handleShare() {
    const blob = await generatePassportImage()
    if (!blob || !wallet) return

    const filename = safePassportFilename(wallet.nickname)
    const file = new File([blob], filename, { type: 'image/png' })
    const text = buildShareText()

    try {
      if (
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: '星球钱包 · 链上护照',
          text,
          files: [file],
        })
        toast.success('已唤起系统分享', { description: '含护照图片与文案' })
        return
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    }

    downloadBlob(blob, filename)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('护照图片已保存', {
        description: '文案已复制到剪贴板，可粘贴到微信 / 微博等',
      })
    } catch {
      toast.success('护照图片已保存', { description: filename })
    }
  }

  function handleQuizSubmit() {
    const ok = submitQuiz(quizAnswers)
    setQuizError(!ok)
    if (ok) {
      if (!passportDone) completeTask('security_passport')
      setQuizSheetOpen(false)
      toast.success('安全护照已生成', { description: '金色护盾已激活' })
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <AiNavigator message={getNavigatorMessage('passport').text} compact />
      <div ref={passportCardRef} id="passport-card" className="rounded-xl">
      <Card className="passport-anniversary-bg overflow-hidden border-2 border-primary/40 shadow-[var(--shadow-card-md)]">
        <CardContent className="p-6 relative">
          <span className="absolute right-4 top-4 text-4xl opacity-30">🪐</span>
          <p className="text-xs tracking-widest text-brand-secondary uppercase">
            imToken 10 周年 · 链上护照
          </p>
          <h2 className="app-page-title mt-2 text-title-md">{wallet.nickname}</h2>
          <p className="app-mono text-primary mt-1.5">
            {shortenAddress(wallet.address, 8)}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">创建时间</dt>
              <dd className="font-medium">{created}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">完成任务</dt>
              <dd className="font-medium">
                {completedTasks.length} / {TOTAL_TASKS}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">护盾等级</dt>
              <dd className={`font-semibold ${shield.color}`}>
                Lv.{shield.rank} · {shield.label}
              </dd>
            </div>
          </dl>
          <blockquote className="mt-6 border-l-2 border-brand-secondary pl-3 text-sm italic whitespace-pre-line">
            {manifesto}
          </blockquote>
          <p className="mt-4 text-[10px] text-muted-foreground">
            Token Core WASM · 本地纪念卡 · 非链上 NFT
          </p>
        </CardContent>
      </Card>
      </div>
      <ShieldBadge level={shieldLevel} />

      <Button
        className="w-full"
        variant={quizPassed ? 'outline' : 'default'}
        onClick={() => setQuizSheetOpen(true)}
      >
        {quizPassed ? '再次打开安全问答弹窗' : '打开安全问答弹窗 · 生成护照'}
      </Button>

      <TaskPassportQuizSheet
        open={quizSheetOpen}
        onOpenChange={setQuizSheetOpen}
        answers={quizAnswers}
        onAnswerChange={setQuizAnswers}
        onSubmit={handleQuizSubmit}
        error={quizError}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          disabled={!quizPassed || capturing}
          onClick={() => void handleSaveImage()}
        >
          {capturing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          保存图片
        </Button>
        <Button
          size="lg"
          className="w-full"
          disabled={!quizPassed || capturing}
          onClick={() => void handleShare()}
        >
          {capturing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          分享护照
        </Button>
      </div>
      <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        <ImageIcon className="h-3 w-3" />
        分享时会自动生成当前护照页高清 PNG（2x）
      </p>

      <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/')}>
        返回任务列表
      </Button>
      <Button variant="ghost" size="sm" onClick={() => void resetDemo()}>
        重置 Demo（清除本地数据）
      </Button>
    </div>
  )
}
