/** Dashboard palette — keep in sync with src/app-theme.css */
export const COPILOT_THEME_TOKENS = {
  light: {
    bg: '#f3f5f8',
    bg2: '#f1f5f9',
    surf: '#ffffff',
    surf2: '#f1f5f9',
    bdr: 'rgba(15, 23, 42, 0.08)',
    txt: '#0f172a',
    txt2: '#0f172a',
    muted: '#64748b',
    blu: '#2563eb',
    ai: '#0891b2',
    success: '#059669',
    warning: '#d97706',
    grn: '#f1f5f9',
    destructive: '#dc2626',
  },
  dark: {
    bg: '#06080d',
    bg2: '#121a27',
    surf: '#0c121c',
    surf2: '#121a27',
    bdr: 'rgba(120, 160, 220, 0.12)',
    txt: '#e8eef5',
    txt2: '#e8eef5',
    muted: '#8b96a8',
    blu: '#2563eb',
    ai: '#22d3ee',
    success: '#34d399',
    warning: '#fbbf24',
    grn: '#121a27',
    destructive: '#f87171',
  },
}

export function getCopilotThemeTokens(theme) {
  return COPILOT_THEME_TOKENS[theme === 'dark' ? 'dark' : 'light']
}
