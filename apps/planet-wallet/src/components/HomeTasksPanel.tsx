import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { taskPath } from '@/lib/task-path'
import { AiNavigator } from '@/components/AiNavigator'
import { ShieldBadge } from '@/components/ShieldBadge'
import { ShieldLevelGuide } from '@/components/ShieldLevelGuide'
import { ShieldStatusBar } from '@/components/ShieldStatusBar'
import { TaskList } from '@/components/TaskList'
import { allTasksDone, countCompleted, TOTAL_TASKS } from '@/lib/tasks'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'

/** 已创建钱包后，欢迎页仅展示的新手任务模块 */
export function HomeTasksPanel() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    wallet,
    shieldLevel,
    shieldPulse,
    completedTasks,
    navigatorText,
  } = useWallet()

  useEffect(() => {
    if (searchParams.get('openBackup') === '1' && wallet) {
      navigate(taskPath('save_key'), { replace: true })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, wallet, navigate, setSearchParams])

  if (!wallet) return null

  const allDone = allTasksDone(completedTasks)
  const readyForPassport =
    countCompleted(completedTasks) >= TOTAL_TASKS - 1 &&
    !completedTasks.includes('security_passport')

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <h2 className="text-title-sm font-bold">新手任务</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          完成 {TOTAL_TASKS} 项安全挑战，升级护盾并领取链上护照。资产与转账请使用底部「钱包」。
        </p>
      </div>

      <ShieldBadge level={shieldLevel} />
      <ShieldLevelGuide currentLevel={shieldLevel} compact />
      <ShieldStatusBar pulse={shieldPulse} />
      <AiNavigator message={navigatorText} compact />

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
          进度 · {completedTasks.length}/{TOTAL_TASKS}
        </h3>
        <TaskList completed={completedTasks} />
      </section>

      {(readyForPassport || allDone) && (
        <Button className="w-full" onClick={() => navigate('/passport')}>
          {allDone ? '查看安全护照' : '领取 10 周年安全护照'}
        </Button>
      )}

    </div>
  )
}
