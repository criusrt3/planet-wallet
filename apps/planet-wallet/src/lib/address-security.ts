/**

 * 地址安全监测 — Sepolia（Blockscout + viem + 可选 Etherscan）

 * 风险判别由 security/SKILL.md 规则引擎（lib/security.ts）驱动

 */

import { formatEther, isAddress, type Address } from 'viem'

import { explorerAddressUrl, explorerTxUrl, getChainById } from './chains'

import { getPublicClientForChain } from './evm'

import {

  analyzeAddressWithSecuritySkill,

  SECURITY_SKILL_REF,

  type ChainInteractionInput,

  type SecuritySkillRuleId,

} from './security'

import type { RiskLevel, SignActionType } from '@/types'



const BLOCKSCOUT_API: Record<string, string> = {

  sepolia: 'https://eth-sepolia.blockscout.com/api/v2',

}



const APPROVE_SELECTOR = '0x095ea7b3'



export interface SecurityFlag {

  id: string

  level: RiskLevel

  title: string

  detail: string

  skillRuleId?: SecuritySkillRuleId

}



export interface RecentInteraction {

  hash: string

  timestamp: string

  direction: 'out' | 'in' | 'self'

  counterparty: string

  counterpartyLabel: string

  method: string

  valueEth: string

  isContractCall: boolean

  isApprove: boolean

  explorerUrl: string

  /** Security Skill 对该笔交互的分类与解读 */

  skillActionType: SignActionType

  skillRiskLevel: RiskLevel

  skillTranslation: string

  skillRuleId: SecuritySkillRuleId | null

  skillNote: string

}



export interface AddressSecurityReport {

  address: Address

  chainId: string

  chainName: string

  scannedAt: string

  isContract: boolean

  isScamFlagged: boolean

  reputation: string | null

  balanceEth: string

  outgoingTxCount: number

  totalTxCount: number | null

  tokenTransferCount: number | null

  uniqueCounterparties: number

  approveCount: number

  contractCallCount: number

  riskLevel: RiskLevel

  riskScore: number

  flags: SecurityFlag[]

  summary: string

  aiAdvice: string

  recentInteractions: RecentInteraction[]

  explorerUrl: string

  dataSourceNote: string

  skillEngine: string

}



interface BlockscoutAddress {

  is_contract?: boolean

  is_scam?: boolean

  reputation?: string

  coin_balance?: string

}



interface BlockscoutCounters {

  transactions_count?: string

  token_transfers_count?: string

}



interface BlockscoutTxItem {

  hash?: string

  timestamp?: string

  from?: { hash?: string; is_contract?: boolean; name?: string }

  to?: { hash?: string; is_contract?: boolean; name?: string }

  method?: string

  transaction_types?: string[]

  value?: string

  status?: string

  raw_input?: string

}



interface EtherscanTx {

  hash: string

  timeStamp: string

  from: string

  to: string

  value: string

  input: string

  isError: string

  functionName?: string

}



async function fetchJson<T>(url: string, timeoutMs = 12_000): Promise<T | null> {

  const ctrl = new AbortController()

  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  try {

    const res = await fetch(url, { signal: ctrl.signal })

    if (!res.ok) return null

    return (await res.json()) as T

  } catch {

    return null

  } finally {

    clearTimeout(timer)

  }

}



async function fetchBlockscoutAddress(

  chainId: string,

  address: Address,

): Promise<BlockscoutAddress | null> {

  const base = BLOCKSCOUT_API[chainId]

  if (!base) return null

  return fetchJson<BlockscoutAddress>(`${base}/addresses/${address}`)

}



async function fetchBlockscoutCounters(

  chainId: string,

  address: Address,

): Promise<BlockscoutCounters | null> {

  const base = BLOCKSCOUT_API[chainId]

  if (!base) return null

  return fetchJson<BlockscoutCounters>(`${base}/addresses/${address}/counters`)

}



async function fetchBlockscoutRecentTxs(

  chainId: string,

  address: Address,

  limit = 12,

): Promise<BlockscoutTxItem[]> {

  const base = BLOCKSCOUT_API[chainId]

  if (!base) return []

  const data = await fetchJson<{ items?: BlockscoutTxItem[] }>(

    `${base}/addresses/${address}/transactions`,

    8_000,

  )

  return (data?.items ?? []).slice(0, limit)

}



async function fetchEtherscanRecentTxs(

  address: Address,

  limit = 15,

): Promise<EtherscanTx[]> {

  const key =

    (import.meta.env.VITE_ETHERSCAN_API_KEY as string | undefined)?.trim() ||

    'YourApiKeyToken'

  const url =

    `https://api.etherscan.io/v2/api?chainid=11155111` +

    `&module=account&action=txlist&address=${address}` +

    `&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${key}`

  const data = await fetchJson<{ status?: string; result?: EtherscanTx[] | string }>(

    url,

  )

  if (!data || data.status !== '1' || !Array.isArray(data.result)) return []

  return data.result

}



type ParsedRow = Omit<

  RecentInteraction,

  | 'skillActionType'

  | 'skillRiskLevel'

  | 'skillTranslation'

  | 'skillRuleId'

  | 'skillNote'

> & { inputData?: string; counterpartyIsContract?: boolean }



function toChainInput(row: ParsedRow): ChainInteractionInput {

  return {

    direction: row.direction,

    method: row.method,

    valueEth: row.valueEth,

    counterparty: row.counterparty,

    counterpartyIsContract: row.counterpartyIsContract,

    inputData: row.inputData,

    isApprove: row.isApprove,

    isContractCall: row.isContractCall,

  }

}



function parseBlockscoutInteractions(

  address: Address,

  chainId: string,

  items: BlockscoutTxItem[],

): ParsedRow[] {

  const lower = address.toLowerCase()

  return items

    .filter((tx) => tx.hash)

    .map((tx) => {

      const from = tx.from?.hash?.toLowerCase() ?? ''

      const to = tx.to?.hash?.toLowerCase() ?? ''

      let direction: ParsedRow['direction'] = 'out'

      if (from === lower && to === lower) direction = 'self'

      else if (to === lower) direction = 'in'

      const counterparty =

        direction === 'in' ? tx.from?.hash ?? '' : tx.to?.hash ?? ''

      const isContractCall = (tx.transaction_types ?? []).includes('contract_call')

      const method = tx.method ?? (isContractCall ? 'contract_call' : 'transfer')

      const valueWei = BigInt(tx.value ?? '0')

      const inputData = tx.raw_input

      return {

        hash: tx.hash!,

        timestamp: tx.timestamp ?? '',

        direction,

        counterparty,

        counterpartyLabel:

          (direction === 'in' ? tx.from?.name : tx.to?.name) ||

          (tx.to?.is_contract || tx.from?.is_contract ? '合约' : '地址'),

        method,

        valueEth: formatEther(valueWei),

        isContractCall,

        isApprove: method.toLowerCase().includes('approve'),

        explorerUrl: explorerTxUrl(chainId, tx.hash!),

        inputData,

        counterpartyIsContract:

          direction === 'in' ? tx.from?.is_contract : tx.to?.is_contract,

      }

    })

}



function parseEtherscanInteractions(

  address: Address,

  chainId: string,

  items: EtherscanTx[],

): ParsedRow[] {

  const lower = address.toLowerCase()

  return items.map((tx) => {

    const from = tx.from.toLowerCase()

    const to = (tx.to || '').toLowerCase()

    let direction: ParsedRow['direction'] = 'out'

    if (from === lower && to === lower) direction = 'self'

    else if (to === lower) direction = 'in'

    const input = tx.input ?? '0x'

    const isContractCall = input.length > 10

    const isApprove =

      input.startsWith(APPROVE_SELECTOR) ||

      (tx.functionName ?? '').toLowerCase().includes('approve')

    const counterparty = direction === 'in' ? tx.from : tx.to

    return {

      hash: tx.hash,

      timestamp: tx.timeStamp

        ? new Date(Number(tx.timeStamp) * 1000).toISOString()

        : '',

      direction,

      counterparty,

      counterpartyLabel: isContractCall ? '合约调用' : '转账',

      method: tx.functionName || (isApprove ? 'approve' : 'transfer'),

      valueEth: formatEther(BigInt(tx.value || '0')),

      isContractCall,

      isApprove,

      explorerUrl: explorerTxUrl(chainId, tx.hash),

      inputData: input,

    }

  })

}



export async function scanAddressSecurity(

  rawAddress: string,

  chainId = 'sepolia',

): Promise<AddressSecurityReport> {

  if (!isAddress(rawAddress)) {

    throw new Error('请输入有效的 0x 地址')

  }

  const address = rawAddress as Address

  const chain = getChainById(chainId)

  if (!chain) throw new Error('暂不支持该链的安全扫描')



  const client = getPublicClientForChain(chainId)

  const [balanceWei, outgoingTxCount, bytecode] = await Promise.all([

    client.getBalance({ address }),

    client.getTransactionCount({ address }),

    client.getBytecode({ address }),

  ])



  const [profile, counters, blockscoutTxs] = await Promise.all([

    fetchBlockscoutAddress(chainId, address),

    fetchBlockscoutCounters(chainId, address),

    fetchBlockscoutRecentTxs(chainId, address),

  ])



  let parsedRows = parseBlockscoutInteractions(address, chainId, blockscoutTxs)

  let dataSourceNote = 'Blockscout + 链上 RPC'



  if (parsedRows.length === 0) {

    const etherscanTxs = await fetchEtherscanRecentTxs(address)

    if (etherscanTxs.length > 0) {

      parsedRows = parseEtherscanInteractions(address, chainId, etherscanTxs)

      dataSourceNote = 'Etherscan + Blockscout + RPC'

    }

  }



  const isContract =

    Boolean(profile?.is_contract) ||

    (bytecode !== undefined && bytecode !== '0x' && bytecode.length > 2)

  const totalTxCount = counters?.transactions_count

    ? Number.parseInt(counters.transactions_count, 10)

    : null

  const tokenTransferCount = counters?.token_transfers_count

    ? Number.parseInt(counters.token_transfers_count, 10)

    : null



  const skill = analyzeAddressWithSecuritySkill({

    scannedAddress: address,

    isContract,

    isScamFlagged: Boolean(profile?.is_scam),

    reputation: profile?.reputation ?? null,

    totalTxCount,

    outgoingTxCount,

    interactions: parsedRows.map(toChainInput),

  })



  const recentInteractions = parsedRows.map((row, i) => {

    const a = skill.interactionAssessments[i]!

    return {

      ...row,

      skillActionType: a.actionType,

      skillRiskLevel: a.analysis.riskLevel,

      skillTranslation: a.analysis.aiTranslation,

      skillRuleId: a.skillRuleId,

      skillNote: a.skillNote,

    }

  })



  const flags: SecurityFlag[] = skill.flags.map((f) => ({

    id: f.id,

    level: f.level,

    title: f.title,

    detail: f.detail,

    skillRuleId: f.skillRuleId,

  }))



  return {

    address,

    chainId,

    chainName: chain.shortName,

    scannedAt: new Date().toISOString(),

    isContract,

    isScamFlagged: Boolean(profile?.is_scam),

    reputation: profile?.reputation ?? null,

    balanceEth: formatEther(balanceWei),

    outgoingTxCount,

    totalTxCount,

    tokenTransferCount,

    uniqueCounterparties: skill.uniqueCounterparties,

    approveCount: skill.approveCount,

    contractCallCount: skill.contractCallCount,

    riskLevel: skill.riskLevel,

    riskScore: skill.riskScore,

    flags,

    summary: skill.summary,

    aiAdvice: skill.aiAdvice,

    recentInteractions,

    explorerUrl: explorerAddressUrl(chainId, address),

    dataSourceNote,

    skillEngine: SECURITY_SKILL_REF,

  }

}



export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {

  info: '低风险关注',

  warning: '需留意',

  danger: '较高风险',

  block: '建议避免',

}


