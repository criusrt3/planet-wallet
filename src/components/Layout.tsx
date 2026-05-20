import { Link, useLocation } from 'react-router-dom'
import { Globe, Home, PenLine, Stamp } from 'lucide-react'
import { useWallet } from '@/store/WalletContext'

const NAV = [
  { to: '/', icon: Home, label: '欢迎' },
  { to: '/planet', icon: Globe, label: '星球', needsWallet: true },
  { to: '/sign', icon: PenLine, label: '签名', needsWallet: true },
  { to: '/passport', icon: Stamp, label: '护照', needsWallet: true },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { wallet } = useWallet()

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-24 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">星球钱包</h1>
          <p className="text-xs text-muted-foreground">imToken 10 周年 · AI 共创 Demo</p>
        </div>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
          本地 Demo
        </span>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {NAV.map(({ to, icon: Icon, label, needsWallet }) => {
            const disabled = needsWallet && !wallet
            const active = pathname === to
            if (disabled) {
              return (
                <span
                  key={to}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground/40"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{label}</span>
                </span>
              )
            }
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
