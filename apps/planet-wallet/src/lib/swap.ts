/**
 * Sepolia Uniswap V3 Swap（exactInputSingle）
 * 测试网演示：滑点保护设为 0，请在 UI 明确提示
 */
import {
  encodeFunctionData,
  erc20Abi,
  getAddress,
  maxUint256,
  parseUnits,
  type Address,
  type Hex,
} from 'viem'
import { getTokenById, SEPOLIA_TOKENS } from './chains'
import {
  assertSepoliaGasBalance,
  formatEvmError,
  readErc20Allowance,
  signAndBroadcast,
  type SignBroadcastResult,
} from './evm'

/** Sepolia Uniswap V3 SwapRouter02 */
export const UNISWAP_SWAP_ROUTER = getAddress(
  '0x101f443b63170925bc522a621840fa913ee734a2',
)

/** Sepolia WETH9 */
export const SEPOLIA_WETH = getAddress(
  '0xfff9976782d46cc05630d1f6d57ab7c27c5f5af3',
)

const POOL_FEES = [3000, 500, 10000] as const

const swapRouterAbi = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const

function resolveTokenAddress(tokenId: string): {
  address: Address
  decimals: number
  isNative: boolean
} {
  const t = getTokenById(tokenId)
  if (!t) throw new Error('不支持的代币')
  if (t.address === null) {
    return { address: SEPOLIA_WETH, decimals: 18, isNative: true }
  }
  return { address: t.address, decimals: t.decimals, isNative: false }
}

function encodeSwap(
  tokenIn: Address,
  tokenOut: Address,
  fee: number,
  recipient: Address,
  amountIn: bigint,
  amountOutMinimum: bigint,
  isNativeIn: boolean,
): { data: Hex; value: bigint } {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
  const data = encodeFunctionData({
    abi: swapRouterAbi,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn,
        tokenOut,
        fee,
        recipient,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })
  return { data, value: isNativeIn ? amountIn : 0n }
}

async function trySwapWithFee(
  params: SwapParams,
  tokenIn: Address,
  tokenOut: Address,
  isNativeIn: boolean,
  amountIn: bigint,
  fee: number,
): Promise<SignBroadcastResult | null> {
  const { data, value } = encodeSwap(
    tokenIn,
    tokenOut,
    fee,
    params.from,
    amountIn,
    0n,
    isNativeIn,
  )
  try {
    const client = (await import('./evm')).getPublicClient()
    await client.estimateGas({
      account: params.from,
      to: UNISWAP_SWAP_ROUTER,
      data,
      value,
    })
    return await signAndBroadcast({
      keystoreJson: params.keystoreJson,
      walletPassword: params.walletPassword,
      from: params.from,
      to: UNISWAP_SWAP_ROUTER,
      value,
      data,
    })
  } catch (e) {
    const msg = formatEvmError(e)
    if (
      /余额|Gas|Token Core|签名|取消|RPC|nonce|insufficient/i.test(msg)
    ) {
      throw new Error(msg)
    }
    return null
  }
}

export interface SwapParams {
  keystoreJson: string
  walletPassword: string
  from: Address
  fromTokenId: string
  toTokenId: string
  amountIn: string
}

export async function executeSepoliaSwap(
  params: SwapParams,
): Promise<{ approve?: SignBroadcastResult; swap: SignBroadcastResult }> {
  if (params.fromTokenId === params.toTokenId) {
    throw new Error('请选择不同的代币')
  }

  const from = resolveTokenAddress(params.fromTokenId)
  const to = resolveTokenAddress(params.toTokenId)
  let amountIn: bigint
  try {
    amountIn = parseUnits(params.amountIn, from.decimals)
  } catch {
    throw new Error('兑换数量格式不正确，请使用数字和小数点')
  }
  if (amountIn <= 0n) throw new Error('兑换数量须大于 0')

  await assertSepoliaGasBalance(params.from, from.isNative ? amountIn : 0n)

  let approveResult: SignBroadcastResult | undefined

  if (!from.isNative) {
    const allowance = await readErc20Allowance(
      params.from,
      from.address,
      UNISWAP_SWAP_ROUTER,
    )
    if (allowance < amountIn) {
      const approveData = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [UNISWAP_SWAP_ROUTER, maxUint256],
      })
      approveResult = await signAndBroadcast({
        keystoreJson: params.keystoreJson,
        walletPassword: params.walletPassword,
        from: params.from,
        to: from.address,
        value: 0n,
        data: approveData,
      })
      await new Promise((r) => setTimeout(r, 4000))
    }
  }

  for (const fee of POOL_FEES) {
    const result = await trySwapWithFee(
      params,
      from.address,
      to.address,
      from.isNative,
      amountIn,
      fee,
    )
    if (result) {
      return { approve: approveResult, swap: result }
    }
  }

  throw new Error(
    '未找到可用流动性池或模拟执行失败。请确认钱包有 Sepolia ETH 作 Gas，并尝试 USDC ↔ LINK 等小额度兑换。',
  )
}
