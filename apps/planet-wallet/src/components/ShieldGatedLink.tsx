import { Link, useNavigate, type LinkProps } from 'react-router-dom'
import {
  canPerformChainOperations,
  promptPurpleShieldRequired,
} from '@/lib/shield-guard'
import { promptCreateWallet } from '@/lib/wallet-guard'
import { useWallet } from '@/store/WalletContext'

type ShieldGatedLinkProps = LinkProps & {
  requireTxAccess?: boolean
}

/** 点击前校验钱包与（可选）紫色护盾，未满足则 Toast 并跳转引导 */
export function ShieldGatedLink({
  requireTxAccess = false,
  onClick,
  to,
  ...rest
}: ShieldGatedLinkProps) {
  const navigate = useNavigate()
  const { wallets, shieldLevel, completedTasks } = useWallet()
  const hasWallet = wallets.length > 0

  return (
    <Link
      to={to}
      {...rest}
      onClick={(e) => {
        if (!hasWallet) {
          e.preventDefault()
          promptCreateWallet(navigate)
          onClick?.(e)
          return
        }
        if (requireTxAccess && !canPerformChainOperations(shieldLevel)) {
          e.preventDefault()
          promptPurpleShieldRequired(navigate, completedTasks)
          onClick?.(e)
          return
        }
        onClick?.(e)
      }}
    />
  )
}
