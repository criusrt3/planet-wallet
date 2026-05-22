import { Link } from 'react-router-dom'
import { ChevronDown, Plus, Users } from 'lucide-react'
import { MAX_WALLETS } from '@/lib/storage'
import { shortenAddress } from '@/lib/wallet'
import { useWallet } from '@/store/WalletContext'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

export function WalletSwitcher() {
  const {
    wallet,
    wallets,
    activeWalletId,
    switchWallet,
    canCreateWallet,
  } = useWallet()

  if (!wallet) return null

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 max-w-[200px]">
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">{wallet.nickname}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>
            身份钱包 · {wallets.length}/{MAX_WALLETS}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {wallets.map((w) => (
            <DropdownMenuItem
              key={w.id}
              onClick={() => switchWallet(w.id)}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">
                {w.nickname}
                {w.id === activeWalletId ? (
                  <Badge variant="primary" className="ml-2 text-[10px]">
                    当前
                  </Badge>
                ) : null}
              </span>
              {w.note ? (
                <span className="text-[10px] text-muted-foreground line-clamp-1">
                  {w.note}
                </span>
              ) : null}
              <span className="font-mono text-[10px] text-muted-foreground">
                {shortenAddress(w.address, 6)}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {canCreateWallet ? (
            <DropdownMenuItem asChild>
              <Link to="/create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                创建新身份
              </Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>已达 {MAX_WALLETS} 个上限</DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/wallets">管理全部身份</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
