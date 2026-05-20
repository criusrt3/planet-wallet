export {
  createPlanetWalletTcx as createPlanetWallet,
  exportWalletMnemonic,
  exportWalletMnemonic as revealMnemonic,
  getDemoMessage,
  signDemoMessageTcx as signDemoMessage,
} from './tcx-wallet'

export { fetchTokenBalances, sendSepoliaTransfer } from './evm'
export type { TokenBalance } from './evm'

export function generateNickname(): string {
  const n = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  return `星际新人 ${n}`
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length < 12) return address
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}
