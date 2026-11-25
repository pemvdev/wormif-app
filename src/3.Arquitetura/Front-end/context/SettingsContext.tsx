import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from './ToastContext';

export type ThemePreference = 'light' | 'dark' | 'system';
export interface AppSettings {
  theme: ThemePreference;
  geolocationEnabled: boolean;
}
export const defaultSettings: AppSettings = {
  theme: 'system', geolocationEnabled: true
};
interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}
const SETTINGS_KEY = 'wormif_app_settings_v1';
const LEGACY_KEY = 'wormif_app_state_v1';
const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY) ?? localStorage.getItem(LEGACY_KEY);
    const parsed = stored ? JSON.parse(stored) as { settings?: Partial<AppSettings> } : {};
    const saved = parsed.settings;
    const theme = saved?.theme;
    return {
      theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : defaultSettings.theme,
      geolocationEnabled: typeof saved?.geolocationEnabled === 'boolean'
        ? saved.geolocationEnabled
        : defaultSettings.geolocationEnabled
    };
  } catch { return defaultSettings; }
}

function applyTheme(theme: ThemePreference) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const { showToast } = useToast();
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }));
    showToast('success', 'Preferências salvas.');
  }, [showToast]);
  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
