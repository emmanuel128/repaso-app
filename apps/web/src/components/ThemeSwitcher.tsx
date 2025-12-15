"use client";

import { useEffect, useState } from 'react';
import type { Theme } from '@/lib/theme';
import { applyTheme, setStoredTheme, initThemeFromStorage, setThemeCookie } from '@/lib/theme';

const options: { value: Theme; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    // initialize from storage and apply
    const t = initThemeFromStorage();
    setTheme(t);
  }, []);

  const handleChange = (value: Theme) => {
    setTheme(value);
    setStoredTheme(value);
    setThemeCookie(value);
    applyTheme(value);
  };

  return (
    <div className="flex items-center gap-2 bg-white/70 backdrop-blur border border-gray-200 rounded-full px-2 py-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          aria-pressed={theme === opt.value}
          className={
            `px-3 py-1 text-sm rounded-full transition-colors ` +
            (theme === opt.value
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-background')
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
