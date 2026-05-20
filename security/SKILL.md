# Wallet Risk Control — Security Skill (摘要)

完整版见：https://github.com/consenlabs/token-ui/blob/main/security/SKILL.md

本 Demo 在 `src/lib/security.ts` 实现：

- 签名四类型翻译：personal_sign / eth_sendTransaction / approve / unknown_contract
- 风险四档：info / warning / danger / block
- 护盾等级与新手安全问答

生成新功能时务必：签名前展示可读意图、无限授权 Danger、助记词不出设备。
