import type { AppTheme } from '@/types'

export type { AppTheme } from '@/types'

export const THEME_OPTIONS: {
  id: AppTheme
  label: string
  description: string
}[] = [
  {
    id: 'default',
    label: '默认深海蓝',
    description: 'imToken 10 周年深色',
  },
  {
    id: 'light',
    label: '亮白',
    description: 'imToken 蓝 + 白底',
  },
]

export function normalizeTheme(raw?: string): AppTheme {
  return raw === 'light' ? 'light' : 'default'
}

/** 同步 <html> 的 dark 类与 data-theme，驱动 @repo/ui 与 app.css */
export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  if (theme === 'default') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
