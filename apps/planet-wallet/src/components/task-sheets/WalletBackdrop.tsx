/** 模拟 dApp 唤起钱包时的页面压暗层 */
export function WalletBackdrop({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div
      className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200"
      aria-hidden
    />
  )
}
