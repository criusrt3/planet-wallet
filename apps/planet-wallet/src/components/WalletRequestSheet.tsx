import { Globe, Loader2 } from 'lucide-react'
import { WalletBackdrop } from '@/components/task-sheets/WalletBackdrop'
import { SignTranslator } from '@/components/SignTranslator'
import type { SignAnalysis } from '@/types'
import type { TutorialRequestField } from '@/lib/tutorial-requests'
import { shortenAddress } from '@/lib/wallet'
import { Button } from '@repo/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet'

interface WalletRequestSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  dappName: string
  dappOrigin: string
  fields: TutorialRequestField[]
  analysis: SignAnalysis
  confirmLabel: string
  loading?: boolean
  demoOnly?: boolean
  onConfirm: () => void | Promise<void>
}

function RequestFieldRow({ field }: { field: TutorialRequestField }) {
  const display =
    field.mono && field.value.startsWith('0x') && field.value.length > 20
      ? shortenAddress(field.value, 6)
      : field.value

  return (
    <div className="flex flex-col gap-0.5 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[11px] text-muted-foreground">{field.label}</span>
      <span
        className={`text-sm break-all ${
          field.mono ? 'font-mono text-xs' : ''
        } ${
          field.highlight === 'danger'
            ? 'font-semibold text-destructive'
            : field.highlight === 'warning'
              ? 'font-medium text-warning-text'
              : 'text-foreground'
        }`}
        title={field.mono ? field.value : undefined}
      >
        {display}
      </span>
      {field.mono && field.value.length > 20 && (
        <span className="font-mono text-[10px] text-muted-foreground break-all">
          {field.value}
        </span>
      )}
    </div>
  )
}

/** 模拟 MetaMask / imToken 式签名、授权、转账确认弹层 */
export function WalletRequestSheet({
  open,
  onOpenChange,
  title,
  dappName,
  dappOrigin,
  fields,
  analysis,
  confirmLabel,
  loading = false,
  demoOnly = false,
  onConfirm,
}: WalletRequestSheetProps) {
  const destructive =
    analysis.actionType === 'approve' ||
    analysis.actionType === 'eth_sendTransaction'

  return (
    <>
      <WalletBackdrop visible={open} />
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-50 max-h-[92vh] rounded-t-2xl px-0 pb-8">
        <SheetHeader className="border-b border-border px-4 pb-3 text-left">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="size-5" />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <p className="text-[11px] text-muted-foreground">请求来源</p>
              <SheetTitle className="text-base leading-tight">{dappName}</SheetTitle>
              <SheetDescription className="truncate font-mono text-[11px]">
                {dappOrigin}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
              {title}
            </span>
            {demoOnly && (
              <span className="rounded-md border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                教学演示 · 除「登录签名」外不会上链
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="overflow-y-auto px-4">
          <div className="rounded-lg border bg-muted/30 px-3">
            {fields.map((f) => (
              <RequestFieldRow key={f.label} field={f} />
            ))}
          </div>

          <div className="mt-4">
            <SignTranslator analysis={analysis} />
          </div>
        </div>

        <SheetFooter className="mt-4 flex-row gap-2 px-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            拒绝
          </Button>
          <Button
            type="button"
            className={`flex-1 ${destructive ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            disabled={loading || !analysis.canProceed}
            onClick={() => void onConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                处理中…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </>
  )
}
