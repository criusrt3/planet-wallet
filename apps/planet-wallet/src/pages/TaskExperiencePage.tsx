import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TaskReplayShell } from '@/components/TaskReplayShell'
import {
  DappConnectHint,
  TaskConnectSheet,
} from '@/components/task-sheets/TaskConnectSheet'
import { TaskBackupSheet } from '@/components/task-sheets/TaskBackupSheet'
import { TaskAddressSheet } from '@/components/task-sheets/TaskAddressSheet'
import { TASK_META } from '@/lib/storage'
import { promptCreateWallet } from '@/lib/wallet-guard'
import { revealMnemonic } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import type { TaskId } from '@/types'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { toast } from '@repo/ui/components/toast'

const PAGE_TASKS = ['light_planet', 'save_key', 'know_address'] as const

function isPageTask(id: string | undefined): id is (typeof PAGE_TASKS)[number] {
  return PAGE_TASKS.includes(id as (typeof PAGE_TASKS)[number])
}

export function TaskExperiencePage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const {
    wallet,
    wallets,
    completedTasks,
    completeTask,
    markBackupViewed,
    markAddressCopied,
    warnScreenshotAttempt,
    emitShieldPulse,
  } = useWallet()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [backupLoading, setBackupLoading] = useState(false)
  const [session, setSession] = useState(0)

  const done =
    taskId && completedTasks.includes(taskId as TaskId)
      ? true
      : false

  useEffect(() => {
    if (!isPageTask(taskId)) {
      navigate('/')
      return
    }
    if (taskId !== 'light_planet' && !wallet) {
      promptCreateWallet(navigate)
      return
    }
    setSheetOpen(true)
  }, [taskId, wallet, navigate, session])

  if (!isPageTask(taskId)) return null

  const meta = TASK_META[taskId]

  async function loadMnemonic() {
    if (!wallet) return
    setBackupLoading(true)
    markBackupViewed()
    try {
      const phrase = await revealMnemonic(
        wallet.keystoreJson,
        wallet.walletPassword,
      )
      setMnemonic(phrase)
    } catch {
      setMnemonic('导出失败，请重置 Demo 后重试')
    } finally {
      setBackupLoading(false)
    }
  }

  useEffect(() => {
    if (taskId === 'save_key' && sheetOpen && wallet) {
      void loadMnemonic()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, sheetOpen, session, wallet?.id])

  function replay() {
    setSession((s) => s + 1)
    setMnemonic(null)
    setSheetOpen(true)
  }

  function finishTask(id: TaskId) {
    if (!completedTasks.includes(id)) {
      completeTask(id)
      toast.success('任务完成', { description: meta.title })
    }
  }

  if (taskId === 'light_planet') {
    const hasWallet = wallets.length > 0
    return (
      <TaskReplayShell
        title={meta.title}
        done={done}
        onReplay={replay}
      >
        <Card>
          <CardContent className="p-4 space-y-3">
            <DappConnectHint />
            <p className="text-sm text-muted-foreground">{meta.description}</p>
            <Button className="w-full" onClick={() => setSheetOpen(true)}>
              打开钱包连接弹窗
            </Button>
          </CardContent>
        </Card>
        <TaskConnectSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          hasWallet={hasWallet}
          onConnect={() => {
            if (hasWallet) {
              finishTask('light_planet')
              navigate('/wallets')
            } else {
              navigate('/create')
            }
          }}
        />
      </TaskReplayShell>
    )
  }

  if (!wallet) return null

  if (taskId === 'save_key') {
    return (
      <TaskReplayShell title={meta.title} done={done} onReplay={replay}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <DappConnectHint />
            <Button className="w-full" onClick={() => setSheetOpen(true)}>
              打开备份助记词弹窗
            </Button>
          </CardContent>
        </Card>
        <TaskBackupSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          mnemonic={mnemonic}
          loading={backupLoading}
          onScreenshotWarn={warnScreenshotAttempt}
          onConfirmSaved={() => {
            finishTask('save_key')
            emitShieldPulse({
              level: 'info',
              message: '护盾 +1：备份提醒已完成。',
              at: Date.now(),
            })
            setSheetOpen(false)
          }}
        />
      </TaskReplayShell>
    )
  }

  if (taskId === 'know_address') {
    return (
      <TaskReplayShell title={meta.title} done={done} onReplay={replay}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <DappConnectHint />
            <Button className="w-full" onClick={() => setSheetOpen(true)}>
              打开地址核对弹窗
            </Button>
          </CardContent>
        </Card>
        <TaskAddressSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          address={wallet.address}
          onCopied={() => {
            markAddressCopied()
            finishTask('know_address')
          }}
        />
      </TaskReplayShell>
    )
  }

  return null
}
