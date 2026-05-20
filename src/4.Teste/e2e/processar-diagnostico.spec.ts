import { test, expect } from '@playwright/test';
import {
  buildImagePayload,
  DIAGNOSTICO_ANALISAR_URL,
  isApiKeyMissingResponse
} from './helpers/api';

test.describe('Processar Diagnóstico (API)', () => {
  test('1 — receber imagem via API', async ({ request }) => {
    const invalid = await request.post(DIAGNOSTICO_ANALISAR_URL, {
      data: { imageBase64: '', mimeType: 'image/png', fileName: 'vazio.png' }
    });
    expect(invalid.status()).toBe(400);
    const invalidBody = await invalid.json();
    expect(invalidBody.success).toBe(false);

    const valid = await request.post(DIAGNOSTICO_ANALISAR_URL, {
      data: buildImagePayload()
    });
    expect(valid.status()).not.toBe(400);

    const validBody = await valid.json();
    expect(validBody).toHaveProperty('success');
    expect(valid.headers()['content-type']).toContain('application/json');
  });

  test('2 — processar imagem (modelo de IA)', async ({ request }) => {
    const response = await request.post(DIAGNOSTICO_ANALISAR_URL, {
      data: buildImagePayload()
    });

    if (await isApiKeyMissingResponse(response)) {
      test.skip(true, 'GEMINI_API_KEY não configurada em .dev.vars');
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data?.especie).toBeTruthy();
    expect(body.data?.nomeComum).toBeTruthy();
    expect(body.data?.estagioVida).toBeTruthy();
  });

  test('3 — retornar resposta do modelo', async ({ request }) => {
    const response = await request.post(DIAGNOSTICO_ANALISAR_URL, {
      data: buildImagePayload()
    });

    if (await isApiKeyMissingResponse(response)) {
      test.skip(true, 'GEMINI_API_KEY não configurada em .dev.vars');
    }

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      especie: expect.any(String),
      nomeComum: expect.any(String),
      estagioVida: expect.any(String),
      nivelConfianca: expect.any(Number),
      descricao: expect.any(String),
      habitat: expect.any(String),
      cicloDeVida: expect.any(String)
    });
    expect(Array.isArray(body.data?.caracteristicas)).toBe(true);
  });
});
