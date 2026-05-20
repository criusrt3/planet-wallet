/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：Sepolia RPC（如 Alchemy）以提升稳定性 */
  readonly VITE_SEPOLIA_RPC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
