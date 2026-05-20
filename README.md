# 星球钱包 · AI 陪你点亮第一个安全钱包

imToken 10 周年 AI 共创 Demo — **官方 Token UI** + **@consenlabs/tcx-wasm**。

## 架构

```text
planet-wallet/          # pnpm monorepo
├── apps/planet-wallet/ # 星球钱包应用
├── packages/ui/        # imToken Design System（来自 token-ui）
├── tooling/tsconfig/
└── security/           # Security Skill（来自 token-ui）
```

| 层级 | 实现 |
|------|------|
| UI | `@repo/ui`（Button、Card、ChatBubble、Dialog…） |
| 钱包 | `@consenlabs/tcx-wasm` — create_keystore / derive_accounts / sign_message |
| 安全 | `security/SKILL.md` + `src/lib/security.ts` |
| AI | `src/lib/ai-navigator.ts` 场景化文案 |

## 快速开始

```bash
pnpm install
pnpm dev
```

打开终端输出的本地地址（通常 `http://localhost:5173`）。

要求：**Node.js ≥ 22.12**，**pnpm 10.33**。

## 钱包 API（tcx-wasm）

- 创建：`create_keystore({ password, network: "MAINNET" })` → PBKDF2 keystore
- 地址：`derive_accounts` — `m/44'/60'/0'/0/0`
- 备份：`export_mnemonic` — 仅在用户打开备份弹窗时解密
- 签名：`sign_message` — ETH `PersonalSign`

实现见 `apps/planet-wallet/src/lib/tcx-wallet.ts`。

## 安全声明

- keystore 与会话密码仅存 localStorage，不上传服务器
- 不广播主网交易，不含 Swap / 无限授权
- 请勿在录屏或 AI 对话中展示真实助记词

## 脚本

```bash
pnpm dev
pnpm build
pnpm typecheck
```

## 与上游仓库同步

```bash
# UI 设计系统
git clone https://github.com/consenlabs/token-ui.git
# 覆盖 packages/ui、security/

# Token Core CLI 参考
git clone -b demo/token-core-cli https://github.com/consenlabs/token-core-monorepo.git
```

MIT
