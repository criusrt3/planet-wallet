import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  getSensitiveActionCopy,
  registerSensitiveConfirm,
  type SensitiveActionKey,
} from '@/lib/confirm-action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog'

interface PendingConfirm {
  action: SensitiveActionKey
  detail?: string
  resolve: (confirmed: boolean) => void
}

export function ConfirmActionProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const runConfirm = useCallback(
    (action: SensitiveActionKey, detail?: string) =>
      new Promise<boolean>((resolve) => {
        setPending({ action, detail, resolve })
      }),
    [],
  )

  useEffect(() => {
    registerSensitiveConfirm(runConfirm)
    return () => registerSensitiveConfirm(null)
  }, [runConfirm])

  function close(confirmed: boolean) {
    pending?.resolve(confirmed)
    setPending(null)
  }

  const copy = pending
    ? getSensitiveActionCopy(pending.action, pending.detail)
    : null

  const isDestructive =
    pending?.action === 'reset_all_data' ||
    pending?.action === 'remove_wallet'

  return (
    <>
      {children}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) close(false)
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={isDestructive ? 'text-destructive' : ''}>
              {copy?.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>{copy?.body}</p>
                {copy?.detail && (
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs text-foreground">
                    {copy.detail}
                  </pre>
                )}
                <p className="text-xs">此操作需要您明确确认后才会执行。</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>取消</AlertDialogCancel>
            <AlertDialogAction
              className={
                isDestructive
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : undefined
              }
              onClick={() => close(true)}
            >
              {copy?.confirmLabel ?? '确定继续'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
