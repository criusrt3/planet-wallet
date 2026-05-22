import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promptCreateWallet } from '@/lib/wallet-guard'
import { useWallet } from '@/store/WalletContext'
import type { WalletIdentity } from '@/types'

export function useRequireWallet(): {
  wallet: WalletIdentity | null
  missing: boolean
} {
  const navigate = useNavigate()
  const { wallet, wallets } = useWallet()
  const missing = wallets.length === 0 || !wallet

  useEffect(() => {
    if (missing) promptCreateWallet(navigate)
  }, [missing, navigate])

  return { wallet, missing }
}
