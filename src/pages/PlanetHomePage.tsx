import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, X } from 'lucide-react'
import { AiNavigator } from '@/components/AiNavigator'
import { PlanetVisualization } from '@/components/PlanetVisualization'
import { ShieldBadge } from '@/components/ShieldBadge'
import { TaskList } from '@/components/TaskList'
import { Button } from '@/components/ui/Button'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'

export function PlanetHomePage() {
  const navigate = useNavigate()
  const {
    wallet,
    shieldLevel,
    completedTasks,
    navigatorText,
    markBackupViewed,
    markAddressCopied,
  } = useWallet()
  const [showBackup, setShowBackup] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!wallet) {
    navigate('/create')
    return null
  }

  const msg = getNavigatorMessage('create_done')

  async function handleCopy() {
    await navigator.clipboard.writeText(wallet!.address)
    setCopied(true)
    markAddressCopied()
    setTimeout(() => setCopied(false), 2000)
  }

  function openBackup() {
    setShowBackup(true)
    markBackupViewed()
  }

  const allDone = completedTasks.length >= 5

  return (
    <div className="space-y-4 animate-fade-up">
      <PlanetVisualization />
      <div className="text-center">
        <p className="text-lg font-bold">{wallet.nickname}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline"
        >
          {shortenAddress(wallet.address, 6)}
          <Copy className="h-3.5 w-3.5" />
          {copied && (
            <span className="text-xs text-success">已复制，请核对完整地址</span>
          )}
        </button>
      </div>
      <ShieldBadge level={shieldLevel} />
      <AiNavigator message={navigatorText || msg.text} compact />
      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          新手任务 · {completedTasks.length}/5
        </h3>
        <TaskList
          completed={completedTasks}
          onBackup={openBackup}
          onCopyAddress={handleCopy}
        />
      </section>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => navigate('/sign')}>
          签名教学
        </Button>
        {allDone && (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => navigate('/passport')}
          >
            领取护照
          </Button>
        )}
      </div>
      {showBackup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="glass-card max-h-[80vh] w-full max-w-md overflow-auto p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-warning">星球钥匙 · 请手写备份</h3>
              <button type="button" onClick={() => setShowBackup(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <AiNavigator message={getNavigatorMessage('backup').text} compact />
            <p className="mt-3 rounded-lg bg-black/30 p-3 font-mono text-xs leading-relaxed break-words">
              {wallet.mnemonic}
            </p>
            <p className="mt-3 text-xs text-destructive">
              Demo 助记词仅用于本次活动体验，请勿存入真实资产。
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => setShowBackup(false)}
            >
              我已抄写保存
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
