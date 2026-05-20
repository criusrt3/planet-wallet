/**
 * Token Core WASM 钱包层（@consenlabs/tcx-wasm）
 * Sepolia 测试网：创建、派生、签名、转账
 */
import initTcx, {
  cache_keystore,
  clear_cached_keystore,
  create_keystore,
  derive_accounts,
  export_mnemonic,
  sign_message,
  sign_tx,
} from '@consenlabs/tcx-wasm'
import { SEPOLIA_CHAIN_ID } from './chains'

const ETH_PATH = "m/44'/60'/0'/0/0"
const DEMO_MESSAGE =
  '欢迎来到星球钱包！这是一次身份确认签名，不会转移任何资产。'

let wasmReady: Promise<void> | null = null

export async function ensureTcxWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = initTcx().then(() => undefined)
  }
  await wasmReady
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw) as T
}

export function generateSessionPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export interface TcxCreatedWallet {
  address: string
  keystoreJson: string
  walletPassword: string
  chainId: number
}

export async function createPlanetWalletTcx(): Promise<TcxCreatedWallet> {
  await ensureTcxWasm()
  const walletPassword = generateSessionPassword()

  const keystoreJson = create_keystore(
    JSON.stringify({
      password: walletPassword,
      network: 'TESTNET',
    }),
  )

  cache_keystore(keystoreJson)

  const accounts = parseJson<{ address: string }[]>(
    derive_accounts(
      JSON.stringify({
        key: walletPassword,
        derivations: [
          {
            chain: 'ETHEREUM',
            derivationPath: ETH_PATH,
            chainId: String(SEPOLIA_CHAIN_ID),
            network: 'TESTNET',
          },
        ],
      }),
    ),
  )

  const address = accounts[0]?.address
  if (!address) throw new Error('无法派生以太坊地址')

  return {
    address,
    keystoreJson,
    walletPassword,
    chainId: SEPOLIA_CHAIN_ID,
  }
}

export async function exportWalletMnemonic(
  keystoreJson: string,
  walletPassword: string,
): Promise<string> {
  await ensureTcxWasm()
  cache_keystore(keystoreJson)
  const result = parseJson<{ mnemonic: string }>(
    export_mnemonic(
      JSON.stringify({
        keystoreJson,
        key: walletPassword,
      }),
    ),
  )
  return result.mnemonic
}

export async function signDemoMessageTcx(
  keystoreJson: string,
  walletPassword: string,
): Promise<string> {
  await ensureTcxWasm()
  cache_keystore(keystoreJson)

  const result = parseJson<{ signature: string }>(
    sign_message(
      JSON.stringify({
        key: walletPassword,
        chain: 'ETHEREUM',
        derivationPath: ETH_PATH,
        input: {
          message: DEMO_MESSAGE,
          signatureType: 'PersonalSign',
        },
      }),
    ),
  )

  return result.signature
}

export async function signEthTransaction(
  keystoreJson: string,
  walletPassword: string,
  input: Record<string, unknown>,
): Promise<{ signature: string; txHash: string }> {
  await ensureTcxWasm()
  cache_keystore(keystoreJson)

  try {
    return parseJson(
      sign_tx(
        JSON.stringify({
          key: walletPassword,
          derivationPath: ETH_PATH,
          input,
        }),
      ),
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`Token Core 签名失败：${msg}`)
  }
}

export function getDemoMessage(): string {
  return DEMO_MESSAGE
}

export function clearTcxSession(): void {
  try {
    clear_cached_keystore()
  } catch {
    /* wasm 未初始化时忽略 */
  }
}
