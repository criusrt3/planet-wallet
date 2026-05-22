import { useState } from 'react'
import { BookUser, Trash2 } from 'lucide-react'
import { ShieldGatedLink } from '@/components/ShieldGatedLink'
import { isAddress } from 'viem'
import { OperationLearning } from '@/components/OperationLearning'
import { useWallet } from '@/store/WalletContext'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { toast } from '@repo/ui/components/toast'

export function AddressBookPage() {
  const { addressBook, addAddressBookEntry, removeAddressBookEntry } = useWallet()
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  function handleAdd() {
    const addr = address.trim()
    if (!label.trim()) {
      toast.error('请填写备注名')
      return
    }
    if (!isAddress(addr)) {
      toast.error('地址格式不正确')
      return
    }
    addAddressBookEntry({
      label: label.trim(),
      address: addr,
      note: note.trim() || undefined,
    })
    toast.success('已加入地址本')
    setLabel('')
    setAddress('')
    setNote('')
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <BookUser className="h-5 w-5 text-primary" />
        <h2 className="text-title-sm font-bold">地址本</h2>
      </div>

      <OperationLearning scene="address_book_add" compact />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加联系人</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="label">备注名</Label>
            <Input
              id="label"
              placeholder="例如：测试好友 A"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addr">地址</Label>
            <Input
              id="addr"
              placeholder="0x..."
              className="font-mono text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">备注（可选）</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleAdd}>
            保存到地址本
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            已保存 · {addressBook.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {addressBook.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              暂无联系人。转账时可从地址本快速填入。
            </p>
          ) : (
            addressBook.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-2 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{entry.label}</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {entry.address}
                  </p>
                  {entry.note ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.note}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="删除"
                  onClick={() => void removeAddressBookEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" asChild>
        <ShieldGatedLink to="/transfer" requireTxAccess>
          去转账
        </ShieldGatedLink>
      </Button>
    </div>
  )
}
