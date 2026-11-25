import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuthToken } from '@Front-end/api/authToken';
import { AuthService } from '@Front-end/service/AuthService';
import type { AuthUsuarioDTO, IntuitoUsoAplicacao } from '@Front-end/dto/AuthDTO';
import { useToast } from './ToastContext';

export interface User {
  id: string;
  name: string;
  email: string;
  profissao: string | null;
  fotoPerfilUrl: string | null;
  linkedin: string | null;
  intuitoUso: IntuitoUsoAplicacao | null;
  permiteAnalisePorTerceiros: boolean;
}
export type ProfileInput = Omit<User, 'id' | 'profissao' | 'linkedin' | 'intuitoUso'> & {
  profissao: string; linkedin: string; intuitoUso: IntuitoUsoAplicacao;
};
export interface RegisterInput {
  name: string; email: string; password: string; profissao: string; fotoPerfilUrl?: string | null;
  linkedin: string; intuitoUso: IntuitoUsoAplicacao; permiteAnalisePorTerceiros: boolean;
}
type AuthResult = { ok: boolean; error?: string };
interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (data: ProfileInput) => Promise<AuthResult>;
  changePassword: (password: string, confirm: string) => { ok: boolean; error?: string };
  requestPasswordReset: (email: string) => void;
}
const AUTH_STATE_KEY = 'wormif_auth_user_v1';
const LEGACY_STATE_KEY = 'wormif_app_state_v1';
const authService = new AuthService();
const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(usuario: AuthUsuarioDTO): User {
  return { id: usuario.id, name: usuario.nome, email: usuario.email, profissao: usuario.profissao,
    fotoPerfilUrl: usuario.fotoPerfilUrl, linkedin: usuario.linkedin, intuitoUso: usuario.intuitoUso,
    permiteAnalisePorTerceiros: usuario.permiteAnalisePorTerceiros };
}
function loadUser(): User | null {
  if (!getAuthToken()) return null;
  try {
    const current = localStorage.getItem(AUTH_STATE_KEY);
    const legacy = current ?? localStorage.getItem(LEGACY_STATE_KEY);
    return legacy ? (JSON.parse(legacy) as { user?: User }).user ?? null : null;
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const { showToast } = useToast();
  useEffect(() => {
    if (user) localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ user }));
    else localStorage.removeItem(AUTH_STATE_KEY);
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const response = await authService.login(email, password);
    if (!response.success || !response.data) return { ok: false, error: response.error ?? 'E-mail ou senha inválidos.' };
    setUser(mapUser(response.data.usuario));
    return { ok: true };
  }, []);
  const register = useCallback(async (data: RegisterInput): Promise<AuthResult> => {
    const response = await authService.register({
      nome: data.name, email: data.email, senha: data.password, profissao: data.profissao.trim() || null,
      fotoPerfilUrl: data.fotoPerfilUrl, linkedin: data.linkedin.trim() || null, intuitoUso: data.intuitoUso,
      permiteAnalisePorTerceiros: data.permiteAnalisePorTerceiros
    });
    if (!response.success || !response.data) return { ok: false, error: response.error ?? 'Não foi possível cadastrar.' };
    setUser(mapUser(response.data.usuario));
    return { ok: true };
  }, []);
  const logout = useCallback(() => { void authService.logout(); setUser(null); }, []);
  const updateProfile = useCallback(async (data: ProfileInput): Promise<AuthResult> => {
    try {
      const response = await authService.updateProfile({
        nome: data.name, email: data.email, profissao: data.profissao.trim() || null,
        fotoPerfilUrl: data.fotoPerfilUrl, linkedin: data.linkedin.trim() || null,
        intuitoUso: data.intuitoUso, permiteAnalisePorTerceiros: data.permiteAnalisePorTerceiros
      });
      if (!response.success || !response.data) return { ok: false, error: response.error ?? 'Não foi possível atualizar o perfil.' };
      setUser(mapUser(response.data));
      showToast('success', 'Perfil atualizado.');
      return { ok: true };
    } catch { return { ok: false, error: 'Não foi possível salvar. Tente novamente.' }; }
  }, [showToast]);
  const changePassword = useCallback((password: string, confirm: string) => {
    if (password.length < 6) return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
    if (password !== confirm) return { ok: false, error: 'As senhas não coincidem.' };
    showToast('success', 'Senha alterada com sucesso (simulação).');
    return { ok: true };
  }, [showToast]);
  const requestPasswordReset = useCallback((email: string) => {
    if (!email.includes('@')) { showToast('error', 'Informe um e-mail válido.'); return; }
    showToast('info', `Link de recuperação enviado para ${email} (simulação).`);
  }, [showToast]);
  const value = useMemo(() => ({ user, setUser, login, register, logout, updateProfile, changePassword, requestPasswordReset }),
    [user, login, register, logout, updateProfile, changePassword, requestPasswordReset]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
