import type { AppTheme } from '@/types'

export type { AppTheme } from '@/types'

export type ResolvedTheme = 'default' | 'light'

export const THEME_OPTIONS: {
  id: AppTheme
  label: string
  description: string
}[] = [
  {
    id: 'system',
    label: '跟随系统',
    description: '随系统深浅色自动切换',
  },
  {
    id: 'light',
    label: '亮白',
    description: 'imToken 蓝 + 白底',
  },
  {
    id: 'default',
    label: '深海蓝',
    description: 'imToken 10 周年深色',
  },
]

function prefersDarkScheme(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function normalizeTheme(raw?: string): AppTheme {
  if (raw === 'system' || raw === 'light' || raw === 'default') return raw
  return 'system'
}

/** 将用户选择解析为实际展示的深浅主题 */
export function resolveTheme(theme: AppTheme): ResolvedTheme {
  if (theme === 'light') return 'light'
  if (theme === 'default') return 'default'
  return prefersDarkScheme() ? 'default' : 'light'
}

/** 同步 <html> 的 dark 类与 data-theme，驱动 @repo/ui 与 app.css */
export function applyTheme(theme: AppTheme): void {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.dataset.themePreference = theme
  root.dataset.theme = resolved
  if (resolved === 'default') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function getThemeStatusLabel(theme: AppTheme): string {
  if (theme === 'system') {
    const resolved = resolveTheme('system')
    return resolved === 'light' ? '跟随系统（当前亮白）' : '跟随系统（当前深海蓝）'
  }
  return THEME_OPTIONS.find((o) => o.id === theme)?.label ?? '跟随系统'
}

/** 监听系统深浅色变化；仅在 theme 为 system 时使用 */
export function subscribeSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {}
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => onChange()
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}
