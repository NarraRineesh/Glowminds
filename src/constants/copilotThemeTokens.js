/** Dashboard palette — keep in sync with src/app-theme.css */
export const COPILOT_THEME_TOKENS = {
  light: {
    bg: '#f8fafc',
    bg2: '#f1f5f9',
    surf: '#ffffff',
    surf2: '#f1f5f9',
    bdr: 'rgba(0, 0, 0, 0.1)',
    txt: '#1e293b',
    txt2: '#1e293b',
    muted: '#64748b',
    blu: '#2563eb',
    grn: '#f1f5f9',
    destructive: '#dc2626',
  },
  dark: {
    bg: '#07090f',
    bg2: '#1a2436',
    surf: '#111827',
    surf2: '#141b26',
    bdr: 'rgba(56, 139, 253, 0.15)',
    txt: '#e6edf3',
    txt2: '#e6edf3',
    muted: '#8b949e',
    blu: '#388bfd',
    grn: '#141b26',
    destructive: '#f85149',
  },
}

export function getCopilotThemeTokens(theme) {
  return COPILOT_THEME_TOKENS[theme === 'dark' ? 'dark' : 'light']
}
