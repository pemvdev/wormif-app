const AUTH_TOKEN_KEY = 'wormif_auth_token';

let unauthorizedHandler: (() => void) | null = null;

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(): void {
  setAuthToken(null);
  unauthorizedHandler?.();
}
