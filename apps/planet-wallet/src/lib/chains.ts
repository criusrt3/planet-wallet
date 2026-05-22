/** 多链测试网配置（同一 EVM 地址跨链查询余额） */
import { getAddress, type Address } from 'viem'

/** viem 要求 EIP-55 校验和，统一用小写再规范化，避免模块加载时抛错导致黑屏 */
function normAddr(hex: string): Address {
  return getAddress(hex.toLowerCase() as Address)
}

export interface ChainTokenDef {
  id: string
  symbol: string
  name: string
  /** null = 原生 gas 代币 */
  address: `0x${string}` | null
  decimals: number
  color: string
}

export interface ChainDef {
  id: string
  name: string
  shortName: string
  chainId: number
  rpcUrl: string
  explorer: string
  nativeSymbol: string
  themeColor: string
  /** 星球轨道卫星标签 */
  orbitLabel: string
  tokens: ChainTokenDef[]
}

export const SUPPORTED_CHAINS: ChainDef[] = [
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    shortName: 'Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
    nativeSymbol: 'ETH',
    themeColor: '#627EEA',
    orbitLabel: 'ETH',
    tokens: [
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
        address: normAddr('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'),
        decimals: 6,
        color: '#2775CA',
      },
      {
        id: 'link',
        symbol: 'LINK',
        name: 'Chainlink (Test)',
        address: normAddr('0x779877a7b0d9e8603169d6a94b85d27d985b2454'),
        decimals: 18,
        color: '#375BD2',
      },
    ],
  },
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    shortName: 'Base',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    nativeSymbol: 'ETH',
    themeColor: '#0052FF',
    orbitLabel: 'Base',
    tokens: [
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'Base Sepolia ETH',
        address: null,
        decimals: 18,
        color: '#0052FF',
      },
      {
        id: 'usdc',
        symbol: 'USDC',
        name: 'USDC (Base Test)',
        address: normAddr('0x10847d1d98d830849eb0844c08cd1545682b29d7'),
        decimals: 6,
        color: '#2775CA',
      },
    ],
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    shortName: 'Arb',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    nativeSymbol: 'ETH',
    themeColor: '#28A0F0',
    orbitLabel: 'Arb',
    tokens: [
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'Arbitrum Sepolia ETH',
        address: null,
        decimals: 18,
        color: '#28A0F0',
      },
    ],
  },
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    shortName: 'OP',
    chainId: 11155420,
    rpcUrl: 'https://sepolia.optimism.io',
    explorer: 'https://sepolia-optimism.etherscan.io',
    nativeSymbol: 'ETH',
    themeColor: '#FF0420',
    orbitLabel: 'OP',
    tokens: [
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'OP Sepolia ETH',
        address: null,
        decimals: 18,
        color: '#FF0420',
      },
    ],
  },
]

export const DEFAULT_ENABLED_CHAIN_IDS = ['sepolia'] as const

export const SEPOLIA_CHAIN_ID = 11155111
export const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io'
export const DEFAULT_SEPOLIA_RPC =
  SUPPORTED_CHAINS.find((c) => c.id === 'sepolia')!.rpcUrl

/** @deprecated 使用 SUPPORTED_CHAINS[sepolia].tokens */
export const SEPOLIA_TOKENS = SUPPORTED_CHAINS.find((c) => c.id === 'sepolia')!
  .tokens

export type SepoliaTokenDef = ChainTokenDef

export function getChainById(id: string): ChainDef | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id)
}

export function assetKey(chainId: string, tokenId: string): string {
  return `${chainId}:${tokenId}`
}

export function parseAssetKey(key: string): { chainId: string; tokenId: string } {
  const i = key.indexOf(':')
  if (i < 1) return { chainId: 'sepolia', tokenId: key }
  return { chainId: key.slice(0, i), tokenId: key.slice(i + 1) }
}

export function getTokenByAssetKey(key: string): {
  chain: ChainDef
  token: ChainTokenDef
} | undefined {
  const { chainId, tokenId } = parseAssetKey(key)
  const chain = getChainById(chainId)
  const token = chain?.tokens.find((t) => t.id === tokenId)
  if (!chain || !token) return undefined
  return { chain, token }
}

/** Sepolia 单链兼容 */
export function getTokenById(id: string): ChainTokenDef | undefined {
  return SEPOLIA_TOKENS.find((t) => t.id === id)
}

export function explorerAddressUrl(chainId: string, address: string): string {
  const chain = getChainById(chainId) ?? getChainById('sepolia')!
  return `${chain.explorer}/address/${address}`
}

export function explorerTxUrl(chainId: string, hash: string): string {
  const chain = getChainById(chainId) ?? getChainById('sepolia')!
  return `${chain.explorer}/tx/${hash}`
}

export const FAUCET_LINKS = [
  {
    name: 'Sepolia ETH（PoW 水龙头）',
    url: 'https://sepolia-faucet.pk910.de/',
  },
  {
    name: 'Circle 测试 USDC',
    url: 'https://faucet.circle.com/',
  },
  {
    name: 'Base Sepolia 水龙头',
    url: 'https://www.alchemy.com/faucets/base-sepolia',
  },
] as const
