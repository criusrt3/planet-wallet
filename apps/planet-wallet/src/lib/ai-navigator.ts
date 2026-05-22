import { countCompleted, normalizeCompletedTasks } from '@/lib/tasks'
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
  quiz_intro: '完成实战挑战后，在护照页答题领取安全护照。',
  quiz_done: '护盾已满级！安全护照已生成。',
  challenge_approve: '授权不是登录。无限 Approve 可能让合约长期动用你的代币。',
  challenge_airdrop: '空投不会索要助记词。索要 12 个词的一律是钓鱼。',
  challenge_poison: '不要只看地址前后几位，大额转账请核对完整 0x 或走地址簿。',
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
    first_sign: '前往签名教学 · 签名翻译器',
    danger_approve: '实战：危险授权挑战',
    fake_airdrop: '实战：假空投识别',
    address_poison: '实战：地址投毒侦探',
    security_passport: '护照页 · 安全问答',
  }
  return hints[taskId] ?? '开始任务'
}

export function computeShieldLevel(
  completedTasks: TaskId[],
  quizPassed: boolean,
): ShieldLevel {
  const done = normalizeCompletedTasks(completedTasks)
  if (
    quizPassed &&
    done.includes('security_passport') &&
    countCompleted(done) >= 8
  ) {
    return 'gold'
  }
  if (done.includes('address_poison') || done.includes('fake_airdrop')) {
    return 'purple'
  }
  if (done.includes('first_sign') || done.includes('danger_approve')) {
    return 'purple'
  }
  if (done.includes('save_key') || done.includes('know_address')) return 'blue'
  if (done.includes('light_planet')) return 'blue'
  return 'initial'
}

export function generateManifesto(nickname: string): string {
  const lines = [
    `我已点亮第一个 Web3 星球，学会保护自己的链上钥匙。`,
    `—— ${nickname}`,
  ]
  return lines.join('\n')
}
