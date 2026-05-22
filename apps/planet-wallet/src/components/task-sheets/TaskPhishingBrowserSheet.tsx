import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { WalletBackdrop } from './WalletBackdrop'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'

interface TaskPhishingBrowserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecognizedPhishing: () => void
}

/** 模拟浏览器内钓鱼空投页 + 钱包拦截提示 */
export function TaskPhishingBrowserSheet({
  open,
  onOpenChange,
  onRecognizedPhishing,
}: TaskPhishingBrowserSheetProps) {
  const [words, setWords] = useState('')
  const [blocked, setBlocked] = useState(false)

  function handleCloseTab() {
    setBlocked(true)
    onRecognizedPhishing()
    setWords('')
    onOpenChange(false)
    setTimeout(() => setBlocked(false), 300)
  }

  return (
    <>
      <WalletBackdrop visible={open} />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="z-50 h-[88vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col"
        >
          <div className="flex items-center gap-2 border-b bg-muted/80 px-3 py-2">
            <div className="flex-1 rounded-md bg-background px-3 py-1.5 font-mono text-[10px] text-muted-foreground truncate">
              https://claim-free-usdt.vercel.app
            </div>
            <button
              type="button"
              className="p-1 text-muted-foreground"
              onClick={() => onOpenChange(false)}
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-destructive/5 to-background">
            <div className="text-center space-y-2">
              <p className="text-2xl">⚡ 限时领取 5000 USDT</p>
              <p className="text-xs text-muted-foreground">
                输入 12 个助记词验证身份 · 2:59:59 后失效
              </p>
            </div>
            <div className="rounded-xl border border-destructive/40 p-4 space-y-3 bg-card">
              <p className="text-sm font-medium">验证钱包所有权</p>
              <Input
                placeholder="word1 word2 word3 …"
                value={words}
                onChange={(e) => setWords(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={words.trim().split(/\s+/).length < 3}
              >
                立即领取
              </Button>
            </div>

            {blocked && (
              <div className="rounded-lg border-2 border-destructive bg-error-surface p-3 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-xs">
                  星球钱包已拦截：任何网站索要助记词均为诈骗，请关闭页面。
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="border-t p-4 flex-col gap-2 sm:flex-col">
            <p className="text-xs text-center text-muted-foreground w-full">
              真实场景：应直接关闭标签页，切勿输入助记词
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              继续在页面里选择（教学）
            </Button>
            <Button
              type="button"
              className="w-full bg-destructive hover:bg-destructive/90"
              onClick={handleCloseTab}
            >
              识别骗局 · 关闭钓鱼页
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
