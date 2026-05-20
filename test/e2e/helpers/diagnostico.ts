import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

export const FIXTURES = {
  png: path.join(fixturesDir, 'sample.png'),
  jpg: path.join(fixturesDir, 'sample.jpg'),
  pdf: path.join(fixturesDir, 'document.pdf')
} as const;

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
          especie: 'Tenebrio molitor',
          nomeComum: 'Bicho-da-farinha',
          estagioVida: 'larva',
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

export function removeImageButton(page: Page) {
  return page.locator('button[class*="destructive"]').first();
}
