import fs from 'node:fs';
import path from 'node:path';
import type { APIResponse } from '@playwright/test';
import { FIXTURES } from './diagnostico';

export const DIAGNOSTICO_ANALISAR_URL = '/api/diagnostico/analisar';

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

export async function isApiKeyMissingResponse(response: APIResponse): Promise<boolean> {
  if (response.status() !== 500) return false;

  const body = (await response.json()) as { error?: string };
  return Boolean(body.error?.includes('API key'));
}
