export type Theme = 'light' | 'dark' | 'auto';

const THEME_KEY = 'repaso:theme';
const THEME_COOKIE = 'repaso:theme';

export function getStoredTheme(): Theme | null {
  try {
    const val = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
    if (val === 'light' || val === 'dark' || val === 'auto') return val as Theme;
    return null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  } catch {
    // ignore
  }
}

export function setThemeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const value = theme;
  // Persist for one year; path=/ for all routes
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE}=${value}; Path=/; Max-Age=${maxAge}`;
}

export function getSystemTheme(): Exclude<Theme, 'auto'> {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    // auto: rely on system preference (media query)
    root.removeAttribute('data-theme');
  }
}

export function initThemeFromStorage(): Theme {
  const stored = getStoredTheme();
  const theme: Theme = stored ?? 'auto';
  applyTheme(theme);
  return theme;
}

export function onSystemThemeChange(callback: (theme: Exclude<Theme, 'auto'>) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => callback(mq.matches ? 'dark' : 'light');
  mq.addEventListener?.('change', handler);
  return () => mq.removeEventListener?.('change', handler);
}
