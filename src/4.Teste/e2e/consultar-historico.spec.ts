import { test, expect } from '@playwright/test';
import { loginAsTestUser, mockHistoricoApi } from './helpers/diagnostico';

test.describe('Consultar Histórico de Diagnóstico', () => {
  test.beforeEach(async ({ page }) => {
    await mockHistoricoApi(page);
    await loginAsTestUser(page);
  });

  test('1 — listar análises salvas', async ({ page }) => {
    await page.goto('/historico');
    await expect(page.getByText('Spodoptera frugiperda')).toBeVisible();
    await expect(page.getByText('Diabrotica speciosa')).toBeVisible();
    await expect(page.getByText('2 registros')).toBeVisible();
  });

  test('2 — buscar por espécie ou estágio', async ({ page }) => {
    await page.goto('/historico');
    await page.getByLabel('Buscar no histórico').fill('vaquinha');
    await expect(page.getByText('Diabrotica speciosa')).toBeVisible();
    await expect(page.getByText('Spodoptera frugiperda')).not.toBeVisible();
  });

  test('3 — ver detalhes de uma análise', async ({ page }) => {
    await page.goto('/historico');
    await page.getByRole('button', { name: 'Ver detalhes' }).first().click();
    await expect(page).toHaveURL(/\/resultado$/);
    await expect(page.getByText('Spodoptera frugiperda')).toBeVisible();
    await expect(page.getByText('Lagarta-do-cartucho')).toBeVisible();
  });
});
