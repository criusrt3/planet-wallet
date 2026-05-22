import { toPng } from 'html-to-image'

export async function captureElementAsPng(
  element: HTMLElement,
  pixelRatio = 2,
): Promise<Blob> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: '#0c1222',
    style: {
      borderRadius: '12px',
    },
  })
  const res = await fetch(dataUrl)
  return res.blob()
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safePassportFilename(nickname: string): string {
  const safe = nickname.replace(/[^\w\u4e00-\u9fa5-]+/g, '_').slice(0, 24)
  return `planet-wallet-passport-${safe || 'demo'}.png`
}
