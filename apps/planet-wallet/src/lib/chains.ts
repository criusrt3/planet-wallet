/** Sepolia 测试网配置与常用测试代币 */
export const SEPOLIA_CHAIN_ID = 11155111

export const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io'

export const DEFAULT_SEPOLIA_RPC =
  'https://ethereum-sepolia-rpc.publicnode.com'

export const FAUCET_LINKS = [
  {
    name: 'Sepolia ETH（PoW 水龙头）',
    url: 'https://sepolia-faucet.pk910.de/',
  },
  {
    name: 'Circle 测试 USDC',
    url: 'https://faucet.circle.com/',
  },
] as const

export interface SepoliaTokenDef {
  id: string
  symbol: string
  name: string
  /** null 表示原生 ETH */
  address: `0x${string}` | null
  decimals: number
  color: string
}

/** 可在 Sepolia 上真实查询余额的测试资产 */
export const SEPOLIA_TOKENS: SepoliaTokenDef[] = [
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Sepolia ETH',
    address: null,
    decimals: 18,
    color: '#627EEA',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin (Test)',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    color: '#2775CA',
  },
  {
    id: 'link',
    symbol: 'LINK',
    name: 'Chainlink (Test)',
    address: '0x779877A7B0D9E8603169D6A94b85D27D985b2454',
    decimals: 18,
    color: '#375BD2',
  },
]

export function getTokenById(id: string): SepoliaTokenDef | undefined {
  return SEPOLIA_TOKENS.find((t) => t.id === id)
}

export function explorerAddressUrl(address: string): string {
  return `${SEPOLIA_EXPLORER}/address/${address}`
}

export function explorerTxUrl(hash: string): string {
  return `${SEPOLIA_EXPLORER}/tx/${hash}`
}
