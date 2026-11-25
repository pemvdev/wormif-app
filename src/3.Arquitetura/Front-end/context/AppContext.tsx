import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { getAuthToken, setUnauthorizedHandler } from '@Front-end/api/authToken';
import type { EstagioDiagnostico } from '@/3.Arquitetura/Dominio/EstagioDiagnostico';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import {
  canGuestAnalyze,
  clearPendingGuestDiagnoses,
  getGuestRemainingAnalyses,
  GUEST_DIAGNOSIS_LIMIT,
  addPendingGuestDiagnosis,
  requeuePendingGuestDiagnosis
} from '@Front-end/context/guestDiagnosis';
import { frontDataToRegistrarPayload, historicoToHistoryItem } from '@Front-end/utils/diagnosticoAdapter';
import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO';
import type { IntuitoUsoAplicacao } from '@Front-end/dto/AuthDTO';
import type { UploadImagemDTO } from '@Front-end/dto/UploadImagemDTO';
import { readGuestImage, deleteGuestImage } from './guestImages';
import {
  captureCurrentLocation as captureCurrentLocationUtil,
  GeolocationError,
  type GeoLocationPoint
} from '@Front-end/utils/geolocation';
import { SettingsProvider, useSettings, type AppSettings } from './SettingsContext';
import { ToastProvider, useToast, type ToastMessage } from './ToastContext';
import { AuthProvider, useAuth, type ProfileInput, type RegisterInput, type User } from './AuthContext';
export type { ProfileInput, User } from './AuthContext';

export interface AnalysisHistoryItem {
  id: number;
  createdAt: string;
  especie: string;
  nomeComum: string;
  diagnosticoBack: EstagioDiagnostico;
  nivelConfianca: number;
  descricao?: string;
  caracteristicas?: string[];
  habitat?: string;
  totalRespostas?: number;
  localizacao?: {
    lat: number;
    lng: number;
    label: string;
  };
}

export type PlanId = 'free' | 'pro' | 'enterprise';
export type { AppSettings, ThemePreference, LanguagePreference } from './SettingsContext';

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
    profissao: string;
    fotoPerfilUrl?: string | null;
    linkedin: string;
    intuitoUso: IntuitoUsoAplicacao;
    permiteAnalisePorTerceiros: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: ProfileInput) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (patch: Partial<AppSettings>) => void;
  refreshHistory: (options?: { silent?: boolean }) => Promise<void>;
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
    localizacao?: AnalysisHistoryItem['localizacao'],
    imagem?: UploadImagemDTO
  ) => Promise<void>;
  showToast: (type: ToastMessage['type'], text: string) => void;
  dismissToast: () => void;
  captureCurrentLocation: () => Promise<GeoLocationPoint>;
  activePlanId: PlanId;
  subscribePlan: (planId: PlanId, planName: string) => void;
  changePassword: (password: string, confirm: string) => { ok: boolean; error?: string };
  requestPasswordReset: (email: string) => void;
}

const STORAGE_KEY = 'wormif_app_state_v1';
const diagnosticoService = new DiagnosticoService();

interface PersistedState {
  activePlanId?: PlanId;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { activePlanId: 'free' };
    }
    const parsed = JSON.parse(raw) as PersistedState & { history?: unknown };
    return {
      activePlanId: parsed.activePlanId ?? 'free'
    };
  } catch {
    return { activePlanId: 'free' };
  }
}

const AppContext = createContext<AppContextValue | null>(null);

function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, setUser, login: authenticate, register: createAccount, logout: endSession,
    updateProfile: saveProfile, changePassword, requestPasswordReset } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState<PlanId>(() => loadState().activePlanId ?? 'free');
  const { toast, showToast, dismissToast } = useToast();
  const [guestRemainingAnalyses, setGuestRemainingAnalyses] = useState(() =>
    user ? GUEST_DIAGNOSIS_LIMIT : getGuestRemainingAnalyses()
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activePlanId }));
  }, [activePlanId]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setHistory([]);
      setGuestRemainingAnalyses(getGuestRemainingAnalyses());
      showToast('info', 'SessÃƒÂ£o expirada ou invÃƒÂ¡lida. FaÃƒÂ§a login novamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [showToast]);

  const syncPendingGuestDiagnoses = useCallback(async () => {
    const pending = clearPendingGuestDiagnoses();
    if (pending.length === 0) return 0;

    let synced = 0;
    for (const item of pending) {
      if (!item.result.success || !item.result.data) continue;
      try {
        const id = await diagnosticoService.registrar(
          { ...frontDataToRegistrarPayload(item.result.data), imagem: await readGuestImage(item.id).catch(() => undefined) }
        );
        synced += 1;
        await deleteGuestImage(item.id).catch(() => undefined);
        if (item.localizacao) await diagnosticoService.atualizarLocalizacao(id, item.localizacao);
      } catch {
        requeuePendingGuestDiagnosis(item);
      }
    }
    return synced;
  }, []);

  const refreshHistory = useCallback(async (options?: { silent?: boolean }) => {
    const token = getAuthToken();
    if (!options?.silent) setHistoryLoading(true);
    try {
      const items = await diagnosticoService.listarHistorico();
      if (token !== getAuthToken()) return;
      setHistory(
        items.map((item) => {
          return historicoToHistoryItem(item);
        })
      );
    } catch {
      if (!options?.silent && token === getAuthToken()) setHistory([]);
    } finally {
      if (!options?.silent) setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void refreshHistory();
    } else {
      setHistory([]);
    }
  }, [user, refreshHistory]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authenticate(email, password);
    if (!response.ok) return response;
    const synced = await syncPendingGuestDiagnoses();
    await refreshHistory();
    setGuestRemainingAnalyses(GUEST_DIAGNOSIS_LIMIT);
    if (synced > 0) {
      showToast('success', `${synced} anÃƒÂ¡lise(s) salva(s) no histÃƒÂ³rico.`);
    } else {
      showToast('success', 'Login realizado com sucesso.');
    }
    return { ok: true };
  }, [authenticate, showToast, syncPendingGuestDiagnoses, refreshHistory]);

  const register = useCallback(async (data: RegisterInput) => {
    const response = await createAccount(data);
    if (!response.ok) return response;
    const synced = await syncPendingGuestDiagnoses();
    await refreshHistory();
    setGuestRemainingAnalyses(GUEST_DIAGNOSIS_LIMIT);
    showToast('success', synced > 0 ? `Conta criada. ${synced} anÃ¡lise(s) salva(s) no histÃ³rico.` : 'Conta criada. Bem-vindo ao Wormif!');
    return { ok: true };
  }, [createAccount, showToast, syncPendingGuestDiagnoses, refreshHistory]);

  const logout = useCallback(() => {
    endSession();
    setHistory([]);
    setGuestRemainingAnalyses(getGuestRemainingAnalyses());
    showToast('info', 'SessÃ£o encerrada.');
  }, [endSession, showToast]);

  const canAnalyze = useCallback(() => {
    if (user) return true;
    return canGuestAnalyze();
  }, [user]);

  const recordGuestDiagnosis = useCallback(
    async (result: DiagnosticoResponseDTO, localizacao?: AnalysisHistoryItem['localizacao'], imagem?: UploadImagemDTO) => {
      if (user) return;
      const imageSaved = await addPendingGuestDiagnosis(result, localizacao, imagem);
      if (!imageSaved) showToast('info', 'A anÃƒÂ¡lise foi guardada, mas nÃƒÂ£o foi possÃƒÂ­vel preservar a foto neste navegador.');
      setGuestRemainingAnalyses(getGuestRemainingAnalyses());
    },
    [user, showToast]
  );


  const attachLocationToDiagnostico = useCallback(
    async (diagnosticoId: number, location: AnalysisHistoryItem['localizacao']) => {
      if (!location) return;
      try {
        await diagnosticoService.atualizarLocalizacao(diagnosticoId, location);
        setHistory((prev) => prev.map((item) => (item.id === diagnosticoId ? { ...item, localizacao: location } : item)));
      } catch {
        showToast('error', 'NÃƒÂ£o foi possÃƒÂ­vel salvar a localizaÃƒÂ§ÃƒÂ£o da anÃƒÂ¡lise.');
      }
    },
    [showToast]
  );

  const removeAnalysis = useCallback(
    async (id: number) => {
      await diagnosticoService.excluir(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      showToast('success', 'AnÃƒÂ¡lise excluÃƒÂ­da');
    },
    [showToast]
  );

  const captureCurrentLocation = useCallback(async (): Promise<GeoLocationPoint> => {
    if (!settings.geolocationEnabled) {
      throw new GeolocationError('Ative a geolocalizaÃƒÂ§ÃƒÂ£o para registrar posiÃƒÂ§ÃƒÂ£o.');
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
      updateProfile: saveProfile,
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
      saveProfile,
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

export function AppProvider({ children }: { children: ReactNode }) {
  return <ToastProvider><AuthProvider><SettingsProvider><AppStateProvider>{children}</AppStateProvider></SettingsProvider></AuthProvider></ToastProvider>;
}
