import { test, expect } from '@playwright/test';
import {
  FIXTURES,
  mockDiagnosticoApi,
  removeImageButton,
  uploadImage
} from './helpers/diagnostico';

test.describe('Manter Diagnóstico', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1 — adicionar imagem fotografada (.png ou .jpg)', async ({ page }) => {
    await uploadImage(page, FIXTURES.png);
    await expect(page.getByText('Imagem carregada')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Identificar Espécie' })).toBeVisible();
  });

  test('2 — arquivo com formato não suportado (.pdf)', async ({ page }) => {
    await uploadImage(page, FIXTURES.pdf);
    await expect(page.getByText(/Formato não suportado/)).toBeVisible();
    await expect(page.getByText('Arraste uma imagem ou clique para selecionar')).toBeVisible();
  });

  test('3 — excluir imagem escolhida antes de enviar', async ({ page }) => {
    await uploadImage(page, FIXTURES.png);
    await expect(page.getByText('Imagem carregada')).toBeVisible();

    await removeImageButton(page).click();

    await expect(page.getByText('Imagem carregada')).not.toBeVisible();
    await expect(page.getByText('Arraste uma imagem ou clique para selecionar')).toBeVisible();
  });

  test('4 — trocar imagem escolhida antes de enviar', async ({ page }) => {
    await uploadImage(page, FIXTURES.png);
    await removeImageButton(page).click();

    await uploadImage(page, FIXTURES.jpg);
    await expect(page.getByText('Imagem carregada')).toBeVisible();
  });

  test('5 — enviar imagem para identificação', async ({ page }) => {
    await mockDiagnosticoApi(page);
    await uploadImage(page, FIXTURES.png);

    await page.getByRole('button', { name: 'Identificar Espécie' }).click();

    await expect(page.getByText('Espécie Identificada')).toBeVisible();
    await expect(page.getByText('Tenebrio molitor')).toBeVisible();
    await expect(page.getByText('Bicho-da-farinha')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Descrição' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Características Identificadas' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Habitat Natural' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ciclo de Vida' })).toBeVisible();
  });

  test('6 — iniciar nova análise', async ({ page }) => {
    await mockDiagnosticoApi(page);
    await uploadImage(page, FIXTURES.png);
    await page.getByRole('button', { name: 'Identificar Espécie' }).click();
    await expect(page.getByText('Espécie Identificada')).toBeVisible();

    await page.getByRole('button', { name: 'Nova Análise' }).click();

    await expect(page.getByText('Arraste uma imagem ou clique para selecionar')).toBeVisible();
    await expect(page.getByText('Espécie Identificada')).not.toBeVisible();
  });

  test.skip('7 — excluir diagnóstico', async () => {
    // Plano de testes: selecionar diagnóstico e "Excluir Análise" → "Análise excluída".
    // A UI atual não expõe listagem nem exclusão de análises salvas.
  });
});
