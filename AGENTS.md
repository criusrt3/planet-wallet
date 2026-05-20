# AGENTS.md — 星球钱包

## Monorepo

- `apps/planet-wallet` — 主应用
- `packages/ui` — imToken Token UI（来自 consenlabs/token-ui）
- `security/SKILL.md` — 安全 Skill，生成签名/助记词相关代码前必读

## 钱包

使用 `@consenlabs/tcx-wasm`，入口 `apps/planet-wallet/src/lib/tcx-wallet.ts`。

勿用 ethers 替代签名/创建；UI 使用 `@repo/ui/components/*`。

## 命令

```bash
pnpm dev
pnpm build
```
