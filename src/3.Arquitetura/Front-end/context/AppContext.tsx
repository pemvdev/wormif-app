import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { getAuthToken } from '@Front-end/api/authToken';
import type { DiagnosticoFront } from '@/3.Arquitetura/Front-end/model/Diagnostico';
import { AuthService } from '@Front-end/service/AuthService';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import {
  canGuestAnalyze,
  clearPendingGuestDiagnoses,
  getGuestRemainingAnalyses,
  GUEST_DIAGNOSIS_LIMIT,
  addPendingGuestDiagnosis,
  requeuePendingGuestDiagnosis
} from '@Front-end/context/guestDiagnosis';
import { frontDataToRegistrarPayload, historicoToHistoryItem } from '@Front-end/utils/diagnosticoMapper';
import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO';
import {
  captureCurrentLocation as captureCurrentLocationUtil,
  GeolocationError,
  type GeoLocationPoint
} from '@Front-end/utils/geolocation';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AnalysisHistoryItem {
  id: number;
  createdAt: string;
  especie: string;
  nomeComum: string;
  diagnosticoFront: DiagnosticoFront;
  nivelConfianca: number;
  descricao?: string;
  caracteristicas?: string[];
  habitat?: string;
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
  historyLoading: boolean;
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
  refreshHistory: () => Promise<void>;
  attachLocationToDiagnostico: (
    diagnosticoId: number,
    location: AnalysisHistoryItem['localizacao']
  ) => void;
  removeAnalysis: (id: number) => Promise<void>;
  canAnalyze: () => boolean;
  guestRemainingAnalyses: number;
  guestDiagnosisLimit: number;
  recordGuestDiagnosis: (
    result: DiagnosticoResponseDTO,
    localizacao?: AnalysisHistoryItem['localizacao']
  ) => void;
  showToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: () => void;
  captureCurrentLocation: () => Promise<GeoLocationPoint>;
  activePlanId: PlanId;
  subscribePlan: (planId: PlanId, planName: string) => void;
  changePassword: (password: string, confirm: string) => { ok: boolean; error?: string };
  requestPasswordReset: (email: string) => void;
}

const STORAGE_KEY = 'wormif_app_state_v1';
const authService = new AuthService();
const diagnosticoService = new DiagnosticoService();

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

interface PersistedState {
  user: User | null;
  settings: AppSettings;
  geoByDiagnosticoId: Record<string, AnalysisHistoryItem['localizacao']>;
  activePlanId?: PlanId;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { user: null, settings: defaultSettings, geoByDiagnosticoId: {}, activePlanId: 'free' };
    }
    const parsed = JSON.parse(raw) as PersistedState & { history?: unknown };
    const user = parsed.user && getAuthToken() ? parsed.user : null;
    return {
      user,
      settings: { ...defaultSettings, ...parsed.settings },
      geoByDiagnosticoId: parsed.geoByDiagnosticoId ?? {},
      activePlanId: parsed.activePlanId ?? 'free'
    };
  } catch {
    return { user: null, settings: defaultSettings, geoByDiagnosticoId: {}, activePlanId: 'free' };
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
  const [geoByDiagnosticoId, setGeoByDiagnosticoId] = useState<
    Record<string, AnalysisHistoryItem['localizacao']>
  >(() => loadState().geoByDiagnosticoId);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState<PlanId>(() => loadState().activePlanId ?? 'free');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [guestRemainingAnalyses, setGuestRemainingAnalyses] = useState(() =>
    user ? GUEST_DIAGNOSIS_LIMIT : getGuestRemainingAnalyses()
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user, settings, geoByDiagnosticoId, activePlanId })
    );
  }, [user, settings, geoByDiagnosticoId, activePlanId]);

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

  const syncPendingGuestDiagnoses = useCallback(async () => {
    const pending = clearPendingGuestDiagnoses();
    if (pending.length === 0) return 0;

    let synced = 0;
    for (const item of pending) {
      if (!item.result.success || !item.result.data) continue;
      try {
        const id = await diagnosticoService.registrar(
          frontDataToRegistrarPayload(item.result.data)
        );
        synced += 1;
        if (item.localizacao) {
          setGeoByDiagnosticoId((prev) => ({ ...prev, [String(id)]: item.localizacao }));
        }
      } catch {
        requeuePendingGuestDiagnosis(item);
      }
    }
    return synced;
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const items = await diagnosticoService.listarHistorico();
      setHistory(
        items.map((item) => {
          const mapped = historicoToHistoryItem(item);
          const localizacao = geoByDiagnosticoId[String(item.id)];
          return localizacao ? { ...mapped, localizacao } : mapped;
        })
      );
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [geoByDiagnosticoId]);

  useEffect(() => {
    if (user) {
      void refreshHistory();
    } else {
      setHistory([]);
    }
  }, [user, refreshHistory]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (!response.success || !response.data) {
      return { ok: false, error: response.error ?? 'E-mail ou senha inválidos.' };
    }
    setUser({
      id: response.data.usuario.id,
      name: response.data.usuario.nome,
      email: response.data.usuario.email
    });
    const synced = await syncPendingGuestDiagnoses();
    await refreshHistory();
    setGuestRemainingAnalyses(GUEST_DIAGNOSIS_LIMIT);
    if (synced > 0) {
      showToast('success', `${synced} análise(s) salva(s) no histórico.`);
    } else {
      showToast('success', 'Login realizado com sucesso.');
    }
    return { ok: true };
  }, [showToast, syncPendingGuestDiagnoses, refreshHistory]);

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      const response = await authService.register({
        nome: data.name,
        email: data.email,
        senha: data.password
      });
      if (!response.success || !response.data) {
        return { ok: false, error: response.error ?? 'Não foi possível cadastrar.' };
      }
      setUser({
        id: response.data.usuario.id,
        name: response.data.usuario.nome,
        email: response.data.usuario.email
      });
      const synced = await syncPendingGuestDiagnoses();
      await refreshHistory();
      setGuestRemainingAnalyses(GUEST_DIAGNOSIS_LIMIT);
      if (synced > 0) {
        showToast('success', `Conta criada. ${synced} análise(s) salva(s) no histórico.`);
      } else {
        showToast('success', 'Conta criada. Bem-vindo ao Wormif!');
      }
      return { ok: true };
    },
    [showToast, syncPendingGuestDiagnoses, refreshHistory]
  );

  const logout = useCallback(() => {
    void authService.logout();
    setUser(null);
    setHistory([]);
    setGuestRemainingAnalyses(getGuestRemainingAnalyses());
    showToast('info', 'Sessão encerrada.');
  }, [showToast]);

  const canAnalyze = useCallback(() => {
    if (user) return true;
    return canGuestAnalyze();
  }, [user]);

  const recordGuestDiagnosis = useCallback(
    (result: DiagnosticoResponseDTO, localizacao?: AnalysisHistoryItem['localizacao']) => {
      if (user) return;
      addPendingGuestDiagnosis(result, localizacao);
      setGuestRemainingAnalyses(getGuestRemainingAnalyses());
    },
    [user]
  );

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

  const attachLocationToDiagnostico = useCallback(
    (diagnosticoId: number, location: AnalysisHistoryItem['localizacao']) => {
      if (!location) return;
      setGeoByDiagnosticoId((prev) => ({ ...prev, [String(diagnosticoId)]: location }));
      setHistory((prev) =>
        prev.map((item) => (item.id === diagnosticoId ? { ...item, localizacao: location } : item))
      );
    },
    []
  );

  const removeAnalysis = useCallback(
    async (id: number) => {
      await diagnosticoService.excluir(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setGeoByDiagnosticoId((prev) => {
        const next = { ...prev };
        delete next[String(id)];
        return next;
      });
      showToast('success', 'Análise excluída');
    },
    [showToast]
  );

  const captureCurrentLocation = useCallback(async (): Promise<GeoLocationPoint> => {
    if (!settings.geolocationEnabled) {
      throw new GeolocationError('Ative a geolocalização para registrar posição.');
    }
    return captureCurrentLocationUtil();
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
      historyLoading,
      toast,
      activePlanId,
      login,
      register,
      logout,
      updateProfile,
      updateSettings,
      refreshHistory,
      attachLocationToDiagnostico,
      removeAnalysis,
      canAnalyze,
      guestRemainingAnalyses,
      guestDiagnosisLimit: GUEST_DIAGNOSIS_LIMIT,
      recordGuestDiagnosis,
      showToast,
      dismissToast,
      captureCurrentLocation,
      subscribePlan,
      changePassword,
      requestPasswordReset
    }),
    [
      user,
      settings,
      history,
      historyLoading,
      toast,
      activePlanId,
      login,
      register,
      logout,
      updateProfile,
      updateSettings,
      refreshHistory,
      attachLocationToDiagnostico,
      removeAnalysis,
      canAnalyze,
      guestRemainingAnalyses,
      recordGuestDiagnosis,
      showToast,
      dismissToast,
      captureCurrentLocation,
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
