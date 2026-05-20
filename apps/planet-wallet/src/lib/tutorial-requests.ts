/** 新手任务 / 签名教学中的模拟 dApp 请求数据 */
import { getAddress } from 'viem'
import { SEPOLIA_CHAIN_ID, getTokenById } from './chains'
import { UNISWAP_SWAP_ROUTER } from './swap'
import { getDemoMessage } from './wallet'

export const TUTORIAL_DAPP = {
  name: 'Planet Quest',
  origin: 'https://quest.planet-wallet.demo',
} as const

export interface TutorialRequestField {
  label: string
  value: string
  mono?: boolean
  highlight?: 'danger' | 'warning'
}

/** 教学用收款地址（Sepolia 示例，不发起真实转账） */
const DEMO_RECIPIENT = getAddress(
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
)

export function buildTutorialSignFields(
  walletAddress: string,
): TutorialRequestField[] {
  return [
    { label: '网络', value: `Ethereum Sepolia (chainId ${SEPOLIA_CHAIN_ID})` },
    { label: '签名地址', value: walletAddress, mono: true },
    { label: '请求类型', value: 'personal_sign（EIP-191）' },
    { label: '待签名消息', value: getDemoMessage() },
  ]
}

export function buildTutorialApproveFields(): TutorialRequestField[] {
  const usdc = getTokenById('usdc')
  if (!usdc?.address) throw new Error('USDC 配置缺失')

  return [
    { label: '网络', value: `Ethereum Sepolia (chainId ${SEPOLIA_CHAIN_ID})` },
    { label: '授权代币', value: `${usdc.symbol} · ${usdc.name}` },
    { label: '代币合约', value: usdc.address, mono: true },
    { label: '授权给', value: 'Uniswap V3 SwapRouter02' },
    { label: 'Spender 合约', value: UNISWAP_SWAP_ROUTER, mono: true },
    {
      label: '授权额度',
      value: '无限制（Unlimited）',
      highlight: 'danger',
    },
    { label: '预估 Gas', value: '~0.00012 ETH（教学估算）' },
  ]
}

export function buildTutorialTxFields(
  walletAddress: string,
): TutorialRequestField[] {
  return [
    { label: '网络', value: `Ethereum Sepolia (chainId ${SEPOLIA_CHAIN_ID})` },
    { label: '发送方', value: walletAddress, mono: true },
    { label: '收款方', value: DEMO_RECIPIENT, mono: true },
    { label: '转账金额', value: '0.01 ETH' },
    { label: '预估 Gas', value: '~0.00021 ETH（教学估算）' },
    {
      label: '预计总支出',
      value: '~0.01021 ETH',
      highlight: 'warning',
    },
  ]
}
