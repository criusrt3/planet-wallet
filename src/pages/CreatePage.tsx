import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AiNavigator } from '@/components/AiNavigator'
import { Button } from '@/components/ui/Button'
import { getNavigatorMessage } from '@/lib/ai-navigator'
import { useWallet } from '@/store/WalletContext'

export function CreatePage() {
  const navigate = useNavigate()
  const { createWallet } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const msg = getNavigatorMessage('create_intro')

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      await createWallet()
      navigate('/planet')
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <AiNavigator message={msg.text} />
      <div className="glass-card space-y-3 p-5">
        <h2 className="text-base font-semibold">创建安全钱包</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          使用与 Token Core 相同的 BIP39 标准，在浏览器本地生成 12 词助记词与
          EVM 地址。本 Demo 不会连接后端，也不会引导你导入真实大额钱包。
        </p>
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          请勿在录屏或 AI 对话中展示真实助记词。活动演示请使用专用测试钱包。
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button size="lg" disabled={loading} onClick={handleCreate}>
        {loading ? '正在点亮星球…' : '✨ 在本地生成钱包'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
        返回欢迎页
      </Button>
    </div>
  )
}
