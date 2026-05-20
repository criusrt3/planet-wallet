import type { NavigatorMessage, ShieldLevel, TaskId } from '@/types'

const SCENES: Record<string, string | ((ctx?: Record<string, string>) => string)> = {
  welcome:
    '欢迎来到你的第一个链上星球。我会帮你建好钱包、保护私钥，并在每次签名前告诉你风险。',
  create_intro:
    '我会在本地为你生成钱包，私钥和助记词不会上传到任何服务器。',
  create_done:
    '星球已点亮！接下来完成新手任务，逐步升级你的安全护盾。',
  backup:
    '这是你的星球钥匙，丢了我也无法帮你找回。请抄写在纸上，不要截图发给任何人。',
  address:
    '这是你在链上的身份坐标。转账前请让对方核对完整地址。',
  sign_intro:
    '这次操作只是登录式身份确认，不会转走资产，也不会花 Gas。',
  sign_done: '很好！你已经完成第一次安全签名体验。',
  quiz_intro: '最后几道小题，帮你巩固护盾意识。',
  quiz_done: '护盾已升级！你可以领取 10 周年链上护照了。',
  passport: '恭喜完成新手冒险！这张护照可以截图分享你的里程碑。',
  high_risk:
    '这个合约想获得长期支配权限，建议拒绝。若不确定，先退出再查证。',
}

export function getNavigatorMessage(
  scene: string,
  ctx?: Record<string, string>,
): NavigatorMessage {
  const raw = SCENES[scene]
  const text =
    typeof raw === 'function'
      ? raw(ctx)
      : (raw ?? '我是你的链上导航员，不替你做决定，但会在风险发生前提醒你。')

  return { scene, text, hint: ctx?.hint }
}

export function getTaskHint(taskId: TaskId, completed: boolean): string {
  if (completed) return '已完成 ✓'
  const hints: Record<TaskId, string> = {
    light_planet: '点击创建钱包',
    save_key: '在首页查看备份提醒',
    know_address: '复制你的地址',
    first_sign: '前往签名教学页',
    shield_quiz: '完成安全问答',
  }
  return hints[taskId]
}

export function computeShieldLevel(
  completedTasks: TaskId[],
  quizPassed: boolean,
): ShieldLevel {
  if (quizPassed && completedTasks.includes('shield_quiz')) return 'gold'
  if (completedTasks.includes('first_sign')) return 'purple'
  if (completedTasks.includes('save_key')) return 'blue'
  return 'initial'
}

export function generateManifesto(nickname: string): string {
  const lines = [
    `我已点亮第一个 Web3 星球，学会保护自己的链上钥匙。`,
    `—— ${nickname}`,
  ]
  return lines.join('\n')
}
