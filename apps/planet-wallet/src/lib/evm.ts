import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Chain,
  type Hex,
} from 'viem'
import { arbitrumSepolia, baseSepolia, optimismSepolia, sepolia } from 'viem/chains'
import {
  assetKey,
  getChainById,
  getTokenByAssetKey,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_TOKENS,
  SUPPORTED_CHAINS,
  type ChainDef,
  type ChainTokenDef,
} from './chains'
import { signEthTransaction } from './tcx-wallet'

const VIEM_CHAIN: Record<string, Chain> = {
  sepolia,
  'base-sepolia': baseSepolia,
  'arbitrum-sepolia': arbitrumSepolia,
  'optimism-sepolia': optimismSepolia,
}

export interface TokenBalance {
  chainId: string
  chainName: string
  token: ChainTokenDef
  formatted: string
  raw: bigint
}

export interface SignBroadcastParams {
  keystoreJson: string
  walletPassword: string
  from: Address
  to: Address
  value?: bigint
  data?: Hex
  chainId?: number
  explorerBase?: string
}

export interface SignBroadcastResult {
  hash: Hex
  explorerUrl: string
}

function getRpcUrl(chain: ChainDef): string {
  if (chain.id === 'sepolia') {
    const custom = import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined
    if (custom?.trim()) return custom.trim()
  }
  return chain.rpcUrl
}

export function getPublicClientForChain(chainId: string) {
  const chain = getChainById(chainId)
  if (!chain) throw new Error('不支持的链')
  const viemChain = VIEM_CHAIN[chainId]
  if (!viemChain) throw new Error('链客户端未配置')
  return createPublicClient({
    chain: viemChain,
    transport: http(getRpcUrl(chain)),
  })
}

/** @deprecated 使用 getPublicClientForChain('sepolia') */
export function getPublicClient() {
  return getPublicClientForChain('sepolia')
}

export async function fetchChainBalances(
  chainId: string,
  address: Address,
): Promise<TokenBalance[]> {
  const chain = getChainById(chainId)
  if (!chain) return []
  const client = getPublicClientForChain(chainId)
  const results: TokenBalance[] = []

  for (const token of chain.tokens) {
    if (token.address === null) {
      const raw = await client.getBalance({ address })
      results.push({
        chainId: chain.id,
        chainName: chain.shortName,
        token,
        raw,
        formatted: formatUnits(raw, token.decimals),
      })
    } else {
      try {
        const raw = await client.readContract({
          address: token.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        })
        results.push({
          chainId: chain.id,
          chainName: chain.shortName,
          token,
          raw,
          formatted: formatUnits(raw, token.decimals),
        })
      } catch {
        results.push({
          chainId: chain.id,
          chainName: chain.shortName,
          token,
          raw: 0n,
          formatted: '0',
        })
      }
    }
  }

  return results
}

export async function fetchMultiChainBalances(
  address: Address,
  enabledChainIds: string[] | undefined,
): Promise<TokenBalance[]> {
  const ids = (enabledChainIds ?? ['sepolia']).filter((id) => getChainById(id))
  const batches = await Promise.all(
    ids.map((id) =>
      fetchChainBalances(id, address).catch(() => [] as TokenBalance[]),
    ),
  )
  return batches.flat()
}

/** 兼容旧调用：仅 Sepolia */
export async function fetchTokenBalances(
  address: Address,
): Promise<TokenBalance[]> {
  return fetchMultiChainBalances(address, ['sepolia'])
}

export function normalizeSignedTxHex(signature: string): Hex {
  const trimmed = signature.trim()
  const body = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
  if (!/^[0-9a-fA-F]+$/.test(body) || body.length < 100) {
    throw new Error('签名结果无效，无法广播')
  }
  return `0x${body}` as Hex
}

export async function broadcastRawTransaction(
  serialized: Hex,
  chainId = 'sepolia',
): Promise<Hex> {
  const client = getPublicClientForChain(chainId)
  return client.sendRawTransaction({ serializedTransaction: serialized })
}

export async function signAndBroadcast(
  params: SignBroadcastParams,
): Promise<SignBroadcastResult> {
  const evmChainId = params.chainId ?? SEPOLIA_CHAIN_ID
  const explorerBase =
    params.explorerBase ??
    getChainById('sepolia')!.explorer
  const client = getPublicClientForChain(
    SUPPORTED_CHAINS.find((c) => c.chainId === evmChainId)?.id ?? 'sepolia',
  )
  const value = params.value ?? 0n
  const data = params.data ?? '0x'
  const nonce = await client.getTransactionCount({ address: params.from })
  const fees = await client.estimateFeesPerGas()
  const gas = await client.estimateGas({
    account: params.from,
    to: params.to,
    data,
    value,
  })

  const signed = await signEthTransaction(
    params.keystoreJson,
    params.walletPassword,
    {
      nonce: nonce.toString(),
      gasPrice: '',
      gasLimit: gas.toString(),
      to: params.to,
      value: value.toString(),
      data,
      chainId: String(evmChainId),
      txType: '02',
      maxFeePerGas: (fees.maxFeePerGas ?? 30_000_000_000n).toString(),
      maxPriorityFeePerGas: (fees.maxPriorityFeePerGas ?? 1_000_000_000n).toString(),
      accessList: [],
    },
  )

  const raw = normalizeSignedTxHex(signed.signature)
  const hash = await broadcastRawTransaction(
    raw,
    SUPPORTED_CHAINS.find((c) => c.chainId === evmChainId)?.id ?? 'sepolia',
  )
  const txHash = signed.txHash?.startsWith('0x')
    ? (signed.txHash as Hex)
    : hash

  return {
    hash: txHash,
    explorerUrl: `${explorerBase}/tx/${txHash}`,
  }
}

export async function readErc20Allowance(
  owner: Address,
  token: Address,
  spender: Address,
  chainId = 'sepolia',
): Promise<bigint> {
  const client = getPublicClientForChain(chainId)
  return client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })
}

export interface SendTransferParams {
  keystoreJson: string
  walletPassword: string
  from: Address
  /** 格式 chainId:tokenId，如 sepolia:eth */
  assetKey: string
  to: string
  amount: string
}

export async function sendSepoliaTransfer(
  params: SendTransferParams,
): Promise<SignBroadcastResult> {
  if (!isAddress(params.to)) {
    throw new Error('收款地址格式不正确')
  }

  const resolved = getTokenByAssetKey(params.assetKey)
  if (!resolved) throw new Error('不支持的资产')
  const { chain, token } = resolved

  if (chain.id !== 'sepolia') {
    throw new Error('转账与 Swap 当前仅支持 Sepolia，其他链可先查看余额')
  }

  const amountRaw = parseUnits(params.amount, token.decimals)

  if (token.address === null) {
    if (amountRaw <= 0n) throw new Error('转账金额须大于 0')
    return signAndBroadcast({
      keystoreJson: params.keystoreJson,
      walletPassword: params.walletPassword,
      from: params.from,
      to: params.to as Address,
      value: amountRaw,
      data: '0x',
      chainId: chain.chainId,
      explorerBase: chain.explorer,
    })
  }

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [params.to as Address, amountRaw],
  })

  return signAndBroadcast({
    keystoreJson: params.keystoreJson,
    walletPassword: params.walletPassword,
    from: params.from,
    to: token.address,
    value: 0n,
    data,
    chainId: chain.chainId,
    explorerBase: chain.explorer,
  })
}

/** 兼容旧调用：tokenId 视为 sepolia 资产 */
export async function sendTransferLegacy(
  params: Omit<SendTransferParams, 'assetKey'> & { tokenId: string },
): Promise<SignBroadcastResult> {
  return sendSepoliaTransfer({
    ...params,
    assetKey: assetKey('sepolia', params.tokenId),
  })
}

// 保留 SEPOLIA_TOKENS 引用供 swap 等模块
void SEPOLIA_TOKENS
