import { ApiClient } from '../api/ApiClient';
import { setAuthToken } from '../api/authToken';
import type { AuthResponseDTO } from '../dto/AuthDTO';

export class AuthService {
  async register(data: {
    nome: string;
    email: string;
    senha: string;
    ocupacao?: string;
  }): Promise<AuthResponseDTO> {
    const response = await ApiClient.post<AuthResponseDTO>('/auth/register', data, {
      allowErrorBody: true
    });
    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }
    return response;
  }

  async login(email: string, senha: string): Promise<AuthResponseDTO> {
    const response = await ApiClient.post<AuthResponseDTO>(
      '/auth/login',
      { email, senha },
      { allowErrorBody: true }
    );
    if (response.success && response.data) {
      setAuthToken(response.data.token);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await ApiClient.post<{ success: boolean }>('/auth/logout', {});
    } finally {
      setAuthToken(null);
    }
  }
}
