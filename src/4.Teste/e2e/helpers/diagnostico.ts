import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

export const FIXTURES = {
  png: path.join(fixturesDir, 'sample.png'),
  jpg: path.join(fixturesDir, 'sample.jpg'),
  pdf: path.join(fixturesDir, 'document.pdf')
} as const;

export const E2E_TEST_TOKEN = 'e2e-test-token';
export const E2E_TEST_USER_ID = 'test-user-wormif-001';

const mockHistoricoItems = [
  {
    id: 1,
    data: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'concluido',
    nivelConfianca: 0.88,
    diagnosticoBack: 'larva',
    especie: 'Spodoptera frugiperda',
    nomeComum: 'Lagarta-do-cartucho',
    descricao: 'Lagarta com listras longitudinais.',
    caracteristicas: ['Máculas dorsais', 'Alto potencial de dano'],
    habitat: 'Culturas de milho e sorgo.',
    validadoPorEspecialista: false
  },
  {
    id: 2,
    data: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'concluido',
    nivelConfianca: 0.91,
    diagnosticoBack: 'adulto',
    especie: 'Diabrotica speciosa',
    nomeComum: 'Vaquinha',
    descricao: 'Besouro adulto de coloração verde.',
    caracteristicas: ['Élitros com manchas'],
    habitat: 'Pastagens e culturas de verão.',
    validadoPorEspecialista: false
  }
];

export async function mockAuthApi(page: Page): Promise<void> {
  const authResponse = {
    success: true,
    data: {
      token: E2E_TEST_TOKEN,
      usuario: {
        id: E2E_TEST_USER_ID,
        nome: 'teste',
        email: 'teste@wormif.app'
      }
    }
  };

  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authResponse)
    });
  });

  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(authResponse)
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

export async function loginAsTestUser(page: Page): Promise<void> {
  await mockAuthApi(page);
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('teste@wormif.app');
  await page.getByLabel('Senha').fill('senha123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/upload');
}

export async function uploadImage(page: Page, filePath: string): Promise<void> {
  await page.locator('input[type="file"]').setInputFiles(filePath);
}

export async function mockDiagnosticoApi(page: Page): Promise<void> {
  await page.route('**/api/diagnostico/analisar', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 99,
          especie: 'Tenebrio molitor',
          nomeComum: 'Bicho-da-farinha',
          diagnosticoBack: 'larva',
          nivelConfianca: 0.92,
          descricao: 'Larva de coleóptero com corpo segmentado e exoesqueleto rígido.',
          caracteristicas: ['Corpo alongado e segmentado', 'Coloração amarelada'],
          habitat: 'Ambientes com farinha, grãos e materiais orgânicos armazenados.',
          cicloDeVida: 'Ovo → larva → pupa → adulto.',
          proximoEstagio: 'Pupa'
        }
      })
    });
  });
}

export async function mockHistoricoApi(page: Page): Promise<void> {
  let items = [...mockHistoricoItems];

  await page.route('**/api/diagnostico/historico', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: items })
    });
  });

  await page.route('**/api/diagnostico/*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.endsWith('/historico') || url.endsWith('/analisar')) {
      await route.fallback();
      return;
    }

    const id = Number(url.split('/').pop());
    if (method === 'DELETE') {
      items = items.filter((item) => item.id !== id);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
      return;
    }

    if (method === 'GET') {
      const item = items.find((entry) => entry.id === id);
      await route.fulfill({
        status: item ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(
          item ? { success: true, data: item } : { success: false, error: 'Diagnóstico não encontrado' }
        )
      });
      return;
    }

    await route.fallback();
  });
}

export function removeImageButton(page: Page) {
  return page.getByRole('button', { name: 'Remover imagem' });
}
