import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Globe, Home, Send, Settings, Shield } from 'lucide-react'
import { WalletSwitcher } from '@/components/WalletSwitcher'
import {
  canPerformChainOperations,
  promptPurpleShieldRequired,
} from '@/lib/shield-guard'
import { promptCreateWallet } from '@/lib/wallet-guard'
import { useWallet } from '@/store/WalletContext'
import { Badge } from '@repo/ui/components/badge'

const NAV = [
  { to: '/', icon: Home, label: '欢迎', labelWithWallet: '任务' },
  { to: '/planet', icon: Globe, label: '钱包', needsWallet: true },
  {
    to: '/transfer',
    icon: Send,
    label: '转账',
    needsWallet: true,
    needsPurpleShield: true,
  },
  { to: '/security', icon: Shield, label: '安全' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { wallets, shieldLevel, completedTasks } = useWallet()
  const hasWallet = wallets.length > 0
  const canTx = canPerformChainOperations(shieldLevel)

  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-7">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title-sm app-brand-title identity-gradient">
            星球钱包
          </h1>
          <p className="app-meta mt-1">imToken 10 周年 · Sepolia 测试网</p>
        </div>
        <div className="shrink-0">
          {hasWallet ? (
            <WalletSwitcher variant="header" />
          ) : (
            <Badge variant="secondary" className="app-header-badge">
              未创建
            </Badge>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t">
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {NAV.map(
            ({
              to,
              icon: Icon,
              label,
              labelWithWallet,
              needsWallet,
              needsPurpleShield,
            }) => {
            const tabLabel =
              to === '/' && hasWallet && labelWithWallet
                ? labelWithWallet
                : label
            const walletLocked = Boolean(needsWallet && !hasWallet)
            const shieldLocked = Boolean(
              needsPurpleShield && hasWallet && !canTx,
            )
            const disabled = walletLocked || shieldLocked
            const active = pathname === to
            if (disabled) {
              return (
                <button
                  key={to}
                  type="button"
                  className="app-nav-link app-nav-link--disabled flex flex-col items-center gap-1 text-muted-foreground/50"
                  aria-label={
                    walletLocked
                      ? `${tabLabel}（需先创建钱包）`
                      : `${tabLabel}（需紫色护盾）`
                  }
                  onClick={() => {
                    if (walletLocked) promptCreateWallet(navigate)
                    else promptPurpleShieldRequired(navigate, completedTasks)
                  }}
                >
                  <Icon className="h-[1.35rem] w-[1.35rem] stroke-[1.65]" />
                  <span className="app-nav-label">{tabLabel}</span>
                </button>
              )
            }
            return (
              <Link
                key={to}
                to={to}
                className={`app-nav-link flex flex-col items-center gap-1 ${
                  active
                    ? 'app-nav-link--active'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon
                  className={`h-[1.35rem] w-[1.35rem] ${active ? 'stroke-[2]' : 'stroke-[1.65]'}`}
                />
                <span className="app-nav-label">{tabLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
