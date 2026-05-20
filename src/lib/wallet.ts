/**
 * 钱包能力层
 *
 * MVP 使用 ethers.js 在浏览器本地完成 BIP39 创建与 personal_sign，
 * 与 Token Core / tcx-wasm 的创建、签名流程对齐（参考 CLI Demo）。
 *
 * 集成 tcx-wasm 时：将 createPlanetWallet / signDemoMessage 替换为 wasm 绑定即可。
 */
import { ethers } from 'ethers'

export interface CreatedWallet {
  address: string
  mnemonic: string
}

const DEMO_MESSAGE =
  '欢迎来到星球钱包！这是一次身份确认签名，不会转移任何资产。'

export function generateNickname(): string {
  const n = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  return `星际新人 ${n}`
}

/** 本地创建 HD 钱包（私钥不上传） */
export async function createPlanetWallet(): Promise<CreatedWallet> {
  const wallet = ethers.Wallet.createRandom()
  if (!wallet.mnemonic?.phrase) {
    throw new Error('助记词生成失败')
  }
  return {
    address: wallet.address,
    mnemonic: wallet.mnemonic.phrase,
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length < 12) return address
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}

/** Demo：personal_sign，用于教学，不广播交易 */
export async function signDemoMessage(mnemonic: string): Promise<string> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic)
  return wallet.signMessage(DEMO_MESSAGE)
}

export function getDemoMessage(): string {
  return DEMO_MESSAGE
}
