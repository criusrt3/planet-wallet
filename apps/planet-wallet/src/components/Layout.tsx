import { Link, useLocation } from 'react-router-dom'
import {
  ArrowDownUp,
  Globe,
  Home,
  Send,
  Settings,
  Shield,
} from 'lucide-react'
import { useWallet } from '@/store/WalletContext'
import { Badge } from '@repo/ui/components/badge'

const NAV = [
  { to: '/', icon: Home, label: '欢迎', labelWithWallet: '任务' },
  { to: '/planet', icon: Globe, label: '钱包', needsWallet: true },
  { to: '/transfer', icon: Send, label: '转账', needsWallet: true },
  { to: '/swap', icon: ArrowDownUp, label: '兑换', needsWallet: true },
  { to: '/security', icon: Shield, label: '安全' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { wallets } = useWallet()
  const hasWallet = wallets.length > 0

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-24 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-title-sm font-bold tracking-tight">星球钱包</h1>
          <p className="text-caption text-muted-foreground">
            多身份 · Sepolia 测试网
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {hasWallet ? `${wallets.length} 身份` : '未创建'}
        </Badge>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {NAV.map(({ to, icon: Icon, label, labelWithWallet, needsWallet }) => {
            const tabLabel =
              to === '/' && hasWallet && labelWithWallet
                ? labelWithWallet
                : label
            const disabled = needsWallet && !hasWallet
            const active = pathname === to
            if (disabled) {
              return (
                <span
                  key={to}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground/40"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{tabLabel}</span>
                </span>
              )
            }
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{tabLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
