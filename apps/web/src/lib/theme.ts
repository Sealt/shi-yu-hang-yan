export type ThemeId = 'blue' | 'red'

export const THEME_STORAGE_KEY = 'shiyu-theme'

export const themes = [
  {
    id: 'red' as const,
    label: '西电红',
    color: 'rgb(175, 33, 37)',
  },
  {
    id: 'blue' as const,
    label: '西电蓝',
    color: 'rgb(0, 65, 130)',
  },
]

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'blue' || value === 'red'
}

export function getStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeId(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'red'
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function setStoredTheme(theme: ThemeId) {
  applyTheme(theme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
