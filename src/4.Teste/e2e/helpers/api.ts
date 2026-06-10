import fs from 'node:fs';
import path from 'node:path';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { FIXTURES } from './diagnostico';

export const AUTH_LOGIN_URL = '/api/auth/login';
export const DIAGNOSTICO_ANALISAR_URL = '/api/diagnostico/analisar';
export const DIAGNOSTICO_HISTORICO_URL = '/api/diagnostico/historico';

export interface ImageUploadPayload {
  imageBase64: string;
  mimeType: string;
  fileName: string;
}

export function buildImagePayload(
  fixturePath: string = FIXTURES.png,
  mimeType = 'image/png'
): ImageUploadPayload {
  const buffer = fs.readFileSync(fixturePath);
  return {
    imageBase64: buffer.toString('base64'),
    mimeType,
    fileName: path.basename(fixturePath)
  };
}

export async function loginApiUser(request: APIRequestContext): Promise<string> {
  const response = await request.post(AUTH_LOGIN_URL, {
    data: {
      email: 'teste@wormif.app',
      senha: 'senha123'
    }
  });

  if (response.status() !== 200) {
    throw new Error(`Login API failed with status ${response.status()}`);
  }

  const body = (await response.json()) as {
    success: boolean;
    data?: { token: string };
  };

  if (!body.success || !body.data?.token) {
    throw new Error('Login API did not return a valid token');
  }

  return body.data.token;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function isApiKeyMissingResponse(response: APIResponse): Promise<boolean> {
  if (response.status() !== 500) return false;

  const body = (await response.json()) as { error?: string };
  return Boolean(body.error?.includes('API key'));
}
