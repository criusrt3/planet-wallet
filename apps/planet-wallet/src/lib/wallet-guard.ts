import type { NavigateFunction } from 'react-router-dom'
import { toast } from '@repo/ui/components/toast'

/** 未创建钱包时引导回欢迎页点亮星球 */
export function promptCreateWallet(navigate: NavigateFunction): void {
  toast.info('请先点亮星球创建钱包', {
    description: '请回到欢迎页，点击「点亮我的钱包星球」',
  })
  navigate('/', { replace: true })
}
