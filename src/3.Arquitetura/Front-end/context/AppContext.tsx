import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { DiagnosticoFront } from '@/3.Arquitetura/Front-end/model/Diagnostico-Front';
import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO-Front';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AnalysisHistoryItem {
  id: string;
  createdAt: string;
  especie: string;
  nomeComum: string;
  diagnosticoFront: DiagnosticoFront;
  nivelConfianca: number;
  localizacao?: {
    lat: number;
    lng: number;
    label: string;
  };
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'pt' | 'en' | 'es';
export type PlanId = 'free' | 'pro' | 'enterprise';

export interface AppSettings {
  theme: ThemePreference;
  language: LanguagePreference;
  geolocationEnabled: boolean;
  notifications: {
    email: boolean;
    analiseConcluida: boolean;
    promocoes: boolean;
  };
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextValue {
  user: User | null;
  settings: AppSettings;
  history: AnalysisHistoryItem[];
  toast: ToastMessage | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'email'>>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addAnalysisFromResult: (
    result: DiagnosticoResponseDTO,
    location?: AnalysisHistoryItem['localizacao']
  ) => void;
  removeAnalysis: (id: string) => void;
  showToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: () => void;
  resolveMockLocation: () => AnalysisHistoryItem['localizacao'] | undefined;
  activePlanId: PlanId;
  subscribePlan: (planId: PlanId, planName: string) => void;
  changePassword: (password: string, confirm: string) => { ok: boolean; error?: string };
  requestPasswordReset: (email: string) => void;
}

const STORAGE_KEY = 'wormif_app_state_v1';

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'pt',
  geolocationEnabled: true,
  notifications: {
    email: true,
    analiseConcluida: true,
    promocoes: false
  }
};

const seedHistory: AnalysisHistoryItem[] = [
  {
    id: 'seed-1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    especie: 'Spodoptera frugiperda',
    nomeComum: 'Lagarta-do-cartucho',
    diagnosticoFront: 'larva',
    nivelConfianca: 0.88,
    localizacao: { lat: -19.92, lng: -43.94, label: 'Contagem, MG' }
  },
  {
    id: 'seed-2',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    especie: 'Diabrotica speciosa',
    nomeComum: 'Vaquinha',
    diagnosticoFront: 'adulto',
    nivelConfianca: 0.91,
    localizacao: { lat: -21.76, lng: -43.35, label: 'Juiz de Fora, MG' }
  }
];

interface PersistedState {
  user: User | null;
  settings: AppSettings;
  history: AnalysisHistoryItem[];
  activePlanId?: PlanId;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { user: null, settings: defaultSettings, history: seedHistory, activePlanId: 'free' };
    }
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      user: parsed.user ?? null,
      settings: { ...defaultSettings, ...parsed.settings },
      history: parsed.history?.length ? parsed.history : seedHistory,
      activePlanId: parsed.activePlanId ?? 'free'
    };
  } catch {
    return { user: null, settings: defaultSettings, history: seedHistory, activePlanId: 'free' };
  }
}

const AppContext = createContext<AppContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', isDark);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadState().user);
  const [settings, setSettings] = useState<AppSettings>(() => loadState().settings);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() => loadState().history);
  const [activePlanId, setActivePlanId] = useState<PlanId>(() => loadState().activePlanId ?? 'free');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, settings, history, activePlanId })
    );
  }, [user, settings, history, activePlanId]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    const id = crypto.randomUUID();
    setToast({ id, type, text });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.includes('@') || password.length < 6) {
      return { ok: false, error: 'E-mail ou senha inválidos.' };
    }
    const mockUser: User = {
      id: crypto.randomUUID(),
      name: email.split('@')[0].replace('.', ' '),
      email: email.toLowerCase()
    };
    setUser(mockUser);
    showToast('success', 'Login realizado com sucesso.');
    return { ok: true };
  }, [showToast]);

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      if (!data.name.trim()) return { ok: false, error: 'Informe seu nome.' };
      if (!data.email.includes('@')) return { ok: false, error: 'E-mail inválido.' };
      if (data.password.length < 6) {
        return { ok: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }
      setUser({
        id: crypto.randomUUID(),
        name: data.name.trim(),
        email: data.email.toLowerCase()
      });
      showToast('success', 'Conta criada. Bem-vindo ao Wormif!');
      return { ok: true };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    showToast('info', 'Sessão encerrada.');
  }, [showToast]);

  const updateProfile = useCallback((data: Partial<Pick<User, 'name' | 'email'>>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
    showToast('success', 'Perfil atualizado.');
  }, [showToast]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...patch,
      notifications: { ...prev.notifications, ...patch.notifications }
    }));
    showToast('success', 'Preferências salvas.');
  }, [showToast]);

  const addAnalysisFromResult = useCallback(
    (result: DiagnosticoResponseDTO, location?: AnalysisHistoryItem['localizacao']) => {
      if (!result.success || !result.data) return;
      const item: AnalysisHistoryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        especie: result.data.especie,
        nomeComum: result.data.nomeComum,
        diagnosticoFront: result.data.diagnosticoFront,
        nivelConfianca: result.data.nivelConfianca,
        localizacao: location
      };
      setHistory((prev) => [item, ...prev]);
    },
    []
  );

  const removeAnalysis = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast('success', 'Análise excluída');
    },
    [showToast]
  );

  const resolveMockLocation = useCallback((): AnalysisHistoryItem['localizacao'] | undefined => {
    if (!settings.geolocationEnabled) return undefined;
    return {
      lat: -19.9167,
      lng: -43.9345,
      label: 'Belo Horizonte, MG (campo)'
    };
  }, [settings.geolocationEnabled]);

  const subscribePlan = useCallback(
    (planId: PlanId, planName: string) => {
      setActivePlanId(planId);
      showToast('success', `Plano ${planName} ativado com sucesso.`);
    },
    [showToast]
  );

  const changePassword = useCallback((password: string, confirm: string) => {
    if (password.length < 6) {
      return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
    }
    if (password !== confirm) {
      return { ok: false, error: 'As senhas não coincidem.' };
    }
    showToast('success', 'Senha alterada com sucesso (simulação).');
    return { ok: true };
  }, [showToast]);

  const requestPasswordReset = useCallback(
    (email: string) => {
      if (!email.includes('@')) {
        showToast('error', 'Informe um e-mail válido.');
        return;
      }
      showToast('info', `Link de recuperação enviado para ${email} (simulação).`);
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      user,
      settings,
      history,
      toast,
      activePlanId,
      login,
      register,
      logout,
      updateProfile,
      updateSettings,
      addAnalysisFromResult,
      removeAnalysis,
      showToast,
      dismissToast,
      resolveMockLocation,
      subscribePlan,
      changePassword,
      requestPasswordReset
    }),
    [
      user,
      settings,
      history,
      toast,
      activePlanId,
      login,
      register,
      logout,
      updateProfile,
      updateSettings,
      addAnalysisFromResult,
      removeAnalysis,
      showToast,
      dismissToast,
      resolveMockLocation,
      subscribePlan,
      changePassword,
      requestPasswordReset
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
