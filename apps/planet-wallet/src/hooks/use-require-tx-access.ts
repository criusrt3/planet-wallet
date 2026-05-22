import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  canPerformChainOperations,
  promptPurpleShieldRequired,
} from '@/lib/shield-guard'
import { promptCreateWallet } from '@/lib/wallet-guard'
import { useWallet } from '@/store/WalletContext'
import type { WalletIdentity } from '@/types'

/** 转账 / Swap 等链上操作：需已创建钱包且护盾 ≥ 紫色 */
export function useRequireTxAccess(): {
  wallet: WalletIdentity | null
  blocked: boolean
} {
  const navigate = useNavigate()
  const { wallet, wallets, shieldLevel, completedTasks } = useWallet()
  const noWallet = wallets.length === 0 || !wallet
  const lowShield =
    !noWallet && !canPerformChainOperations(shieldLevel)
  const blocked = noWallet || lowShield

  useEffect(() => {
    if (noWallet) promptCreateWallet(navigate)
    else if (lowShield) promptPurpleShieldRequired(navigate, completedTasks)
  }, [noWallet, lowShield, navigate, completedTasks])

  return { wallet, blocked }
}
