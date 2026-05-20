import {
  createPublicClient,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from 'viem'
import { sepolia } from 'viem/chains'
import {
  DEFAULT_SEPOLIA_RPC,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_TOKENS,
  type SepoliaTokenDef,
} from './chains'
import { signEthTransaction } from './tcx-wallet'

export interface TokenBalance {
  token: SepoliaTokenDef
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
}

export interface SignBroadcastResult {
  hash: Hex
  explorerUrl: string
}

function getRpcUrl(): string {
  const custom = import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined
  return custom?.trim() || DEFAULT_SEPOLIA_RPC
}

export function getPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(getRpcUrl()),
  })
}

export async function fetchTokenBalances(
  address: Address,
): Promise<TokenBalance[]> {
  const client = getPublicClient()
  const results: TokenBalance[] = []

  for (const token of SEPOLIA_TOKENS) {
    if (token.address === null) {
      const raw = await client.getBalance({ address })
      results.push({
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
          token,
          raw,
          formatted: formatUnits(raw, token.decimals),
        })
      } catch {
        results.push({
          token,
          raw: 0n,
          formatted: '0',
        })
      }
    }
  }

  return results
}

export function normalizeSignedTxHex(signature: string): Hex {
  const trimmed = signature.trim()
  const body = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
  if (!/^[0-9a-fA-F]+$/.test(body) || body.length < 100) {
    throw new Error('签名结果无效，无法广播')
  }
  return `0x${body}` as Hex
}

export async function broadcastRawTransaction(serialized: Hex): Promise<Hex> {
  const client = getPublicClient()
  return client.sendRawTransaction({ serializedTransaction: serialized })
}

export async function signAndBroadcast(
  params: SignBroadcastParams,
): Promise<SignBroadcastResult> {
  const client = getPublicClient()
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
      chainId: String(SEPOLIA_CHAIN_ID),
      txType: '02',
      maxFeePerGas: (fees.maxFeePerGas ?? 30_000_000_000n).toString(),
      maxPriorityFeePerGas: (fees.maxPriorityFeePerGas ?? 1_000_000_000n).toString(),
      accessList: [],
    },
  )

  const raw = normalizeSignedTxHex(signed.signature)
  const hash = await broadcastRawTransaction(raw)
  const txHash = signed.txHash?.startsWith('0x')
    ? (signed.txHash as Hex)
    : hash

  return {
    hash: txHash,
    explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
  }
}

export async function readErc20Allowance(
  owner: Address,
  token: Address,
  spender: Address,
): Promise<bigint> {
  const client = getPublicClient()
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
  tokenId: string
  to: string
  amount: string
}

export async function sendSepoliaTransfer(
  params: SendTransferParams,
): Promise<SignBroadcastResult> {
  if (!isAddress(params.to)) {
    throw new Error('收款地址格式不正确')
  }

  const token = SEPOLIA_TOKENS.find((t) => t.id === params.tokenId)
  if (!token) throw new Error('不支持的代币')

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
  })
}
