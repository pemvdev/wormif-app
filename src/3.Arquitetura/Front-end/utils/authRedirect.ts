export type AuthRedirectState = {
  from?: string;
  message?: string;
};

const MESSAGES_BY_PATH: Record<string, string> = {
  '/historico': 'Faça login para ver seu histórico de análises.',
  '/perfil': 'Faça login para acessar seu perfil.',
  '/configuracoes': 'Faça login para ajustar suas configurações.',
  '/geolocalizacao': 'Faça login para usar a geolocalização.',
  '/planos': 'Faça login para ver os planos.'
};

export function getAuthMessageForPath(path: string): string {
  return MESSAGES_BY_PATH[path] ?? 'Esta área exige login. Entre ou crie uma conta para continuar.';
}

export function buildAuthRedirectState(from: string, message?: string): AuthRedirectState {
  return {
    from,
    message: message ?? getAuthMessageForPath(from)
  };
}

export function readAuthRedirectState(state: unknown): AuthRedirectState {
  if (!state || typeof state !== 'object') return {};
  const value = state as AuthRedirectState;
  return {
    from: typeof value.from === 'string' ? value.from : undefined,
    message: typeof value.message === 'string' ? value.message : undefined
  };
}
