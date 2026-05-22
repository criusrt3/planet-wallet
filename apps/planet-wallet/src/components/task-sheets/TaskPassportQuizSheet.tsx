import { Shield } from 'lucide-react'
import { QUIZ_QUESTIONS } from '@/lib/security'
import { WalletBackdrop } from './WalletBackdrop'
import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'

interface TaskPassportQuizSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  answers: number[]
  onAnswerChange: (answers: number[]) => void
  onSubmit: () => void
  error: boolean
}

/** 模拟钱包内嵌的安全问答确认层 */
export function TaskPassportQuizSheet({
  open,
  onOpenChange,
  answers,
  onAnswerChange,
  onSubmit,
  error,
}: TaskPassportQuizSheetProps) {
  return (
    <>
      <WalletBackdrop visible={open} />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="z-50 max-h-[92vh] rounded-t-2xl px-0 pb-8"
        >
          <SheetHeader className="border-b px-4 pb-3 text-left">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <SheetTitle className="text-base">安全护照 · 问答确认</SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  星球钱包 · 教学演示
                </p>
              </div>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto px-4 max-h-[55vh] space-y-4 py-3">
            {QUIZ_QUESTIONS.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm mb-2 font-medium">{q.question}</p>
                <RadioGroup
                  value={(answers[qi] ?? -1) >= 0 ? String(answers[qi]) : ''}
                  onValueChange={(v) => {
                    const next = [...answers]
                    next[qi] = Number(v)
                    onAnswerChange(next)
                  }}
                >
                  {q.options.map((opt, oi) => (
                    <div key={opt} className="flex items-center gap-2 py-0.5">
                      <RadioGroupItem value={String(oi)} id={`qs-${q.id}-${oi}`} />
                      <Label htmlFor={`qs-${q.id}-${oi}`} className="text-xs">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            {error && (
              <p className="text-xs text-destructive">还有题目答错了，再想想～</p>
            )}
          </div>
          <SheetFooter className="px-4 gap-2 flex-row sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              关闭
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={answers.some((a) => a < 0)}
              onClick={onSubmit}
            >
              提交确认
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
