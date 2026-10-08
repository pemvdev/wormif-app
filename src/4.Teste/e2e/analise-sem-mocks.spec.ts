import { test, expect } from '@playwright/test';

test('falha da IA nao gera resultado de demonstracao nem consome analise gratuita', async ({ page }) => {
  await page.route('**/api/diagnostico/analisar', (route) => route.fulfill({ status: 500,
    json: { success: false, error: 'Serviço de IA indisponível.' }
  }));
  await page.goto('/upload');
  await expect(page.getByRole('button', { name: 'Usar imagem de exemplo' })).toHaveCount(0);
  await page.locator('input[type="file"]').setInputFiles('src/4.Teste/e2e/fixtures/sample.png');
  await page.getByRole('button', { name: 'Continuar para identificação' }).click();
  await expect(page.getByRole('heading', { name: 'Não foi possível concluir', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver resultado completo' })).toHaveCount(0);
  await expect(page.getByText(/resultado de demonstração/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar com outra imagem' }).click();
  await expect(page.getByText('3 de 3 análises gratuitas', { exact: true })).toBeVisible();
});
