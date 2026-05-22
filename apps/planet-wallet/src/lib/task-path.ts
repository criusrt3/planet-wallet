import type { TaskId } from '@/types'

/** 每个任务的体验入口（支持完成后 replay） */
export function taskPath(id: TaskId): string {
  switch (id) {
    case 'light_planet':
      return '/task/light_planet'
    case 'save_key':
      return '/task/save_key'
    case 'know_address':
      return '/task/know_address'
    case 'first_sign':
      return '/sign?autoSheet=sign'
    case 'danger_approve':
      return '/challenge/danger_approve'
    case 'fake_airdrop':
      return '/challenge/fake_airdrop'
    case 'address_poison':
      return '/challenge/address_poison'
    case 'security_passport':
      return '/passport?openQuiz=1'
    default:
      return '/'
  }
}
