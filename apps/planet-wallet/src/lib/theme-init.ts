import { loadState } from '@/lib/storage'
import { applyTheme, normalizeTheme } from '@/lib/theme'

applyTheme(normalizeTheme(loadState().settings.theme))
