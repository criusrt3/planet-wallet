import { KeyRound, Loader2 } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { SignTranslator } from '@/components/SignTranslator'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { analyzeSignRequest } from '@/lib/security'
import { WalletBackdrop } from './WalletBackdrop'
import { Button } from '@repo/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'
import { Alert, AlertDescription } from '@repo/ui/components/alert'

interface TaskBackupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mnemonic: string | null
  loading: boolean
  onScreenshotWarn: () => void
  onConfirmSaved: () => void
}

/** 模拟钱包「导出助记词 / 备份」底部确认窗 */
export function TaskBackupSheet({
  open,
  onOpenChange,
  mnemonic,
  loading,
  onScreenshotWarn,
  onConfirmSaved,
}: TaskBackupSheetProps) {
  const analysis = analyzeSignRequest('personal_sign')
  const backupAnalysis = {
    ...analysis,
    title: '备份星球钥匙',
    aiTranslation:
      '这是你的助记词备份窗口。任何人拿到助记词都能控制钱包，请勿截图或发送。',
    riskLevel: 'danger' as const,
    irreversible: true,
  }

  return (
    <>
      <WalletBackdrop visible={open} />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="z-50 max-h-[92vh] rounded-t-2xl px-0 pb-8"
        >
          <SheetHeader className="border-b border-border px-4 pb-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-surface text-warning-text">
                <KeyRound className="size-5" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <p className="text-[11px] text-muted-foreground">星球钱包</p>
                <SheetTitle className="text-base leading-tight text-warning-text">
                  备份助记词
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  仅本地解密 · 不会上传服务器
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto px-4 max-h-[50vh]">
            <AiNavigator message={getNavigatorMessage('backup').text} compact />
            <div className="mt-3 rounded-lg border-2 border-warning-border bg-muted/40 p-3">
              {loading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  正在解密助记词…
                </p>
              ) : (
                <p className="font-mono text-xs leading-relaxed break-words">
                  {mnemonic}
                </p>
              )}
            </div>
            <div className="mt-4">
              <SignTranslator analysis={backupAnalysis} />
            </div>
            <Alert variant="destructive" className="mt-3">
              <AlertDescription className="text-xs">
                禁止截图、禁止发给「客服」。丢失后无法找回。
              </AlertDescription>
            </Alert>
          </div>

          <SheetFooter className="mt-4 flex-col gap-2 px-4 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onScreenshotWarn}
            >
              模拟：若截图会发生什么？
            </Button>
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                稍后再说
              </Button>
              <Button
                type="button"
                className="flex-1 bg-destructive hover:bg-destructive/90"
                disabled={loading || !mnemonic}
                onClick={onConfirmSaved}
              >
                我已抄写保存
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
