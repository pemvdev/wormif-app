import { test, expect } from '@playwright/test';
import type { AuthResponseDTO } from '../../3.Arquitetura/Front-end/dto/AuthDTO';

function profileData() {
  return {
    nome: 'Pessoa de teste',
    email: `perfil-${crypto.randomUUID()}@example.com`,
    senha: 'senha123',
    profissao: 'Estudante',
    linkedin: 'https://www.linkedin.com/in/perfil-teste',
    intuitoUso: 'CURIOSIDADE',
    permiteAnalisePorTerceiros: false
  };
}

test('cadastro sem foto e edicao persistente de todos os campos', async ({ page, request }) => {
  const initial = profileData();
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill(initial.nome);
  await page.getByLabel('E-mail', { exact: true }).fill(initial.email);
  await page.getByLabel('Senha', { exact: true }).fill(initial.senha);
  await page.getByLabel('Confirmar senha').fill(initial.senha);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByLabel('Profissão (opcional)')).not.toHaveAttribute('required');
  await expect(page.getByLabel('LinkedIn (opcional)')).not.toHaveAttribute('required');
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await page.goto('/perfil');
  await page.screenshot({ path: '/tmp/wormif-perfil-desktop.png', fullPage: true });
  const email = `editado-${crypto.randomUUID()}@example.com`;
  await page.getByLabel('Nome', { exact: true }).fill('Nome editado');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByRole('radio', { name: 'Ajudar a analisar resultados de outras pessoas' }).check();
  await expect(page.getByLabel('Profissão', { exact: true })).toHaveAttribute('required', '');
  await expect(page.getByLabel('LinkedIn', { exact: true })).toHaveAttribute('required', '');
  await page.getByLabel('Profissão', { exact: true }).fill('Pesquisadora');
  await page.getByLabel('LinkedIn', { exact: true }).fill('https://www.linkedin.com/in/perfil-editado');
  await page.getByRole('switch').check();
  await page.getByLabel('Foto de perfil (opcional)').setInputFiles('src/4.Teste/e2e/fixtures/sample.png');
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeEnabled();
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByText('Perfil atualizado.', { exact: true })).toBeVisible();
  const login = await request.post('/api/auth/login', { data: { email, senha: initial.senha } });
  const saved: AuthResponseDTO = await login.json();
  expect(saved.data?.usuario).toMatchObject({
    nome: 'Nome editado', email, profissao: 'Pesquisadora',
    linkedin: 'https://www.linkedin.com/in/perfil-editado',
    intuitoUso: 'ANALISAR_OUTRAS_PESSOAS', permiteAnalisePorTerceiros: true
  });
  expect(saved.data?.usuario.fotoPerfilUrl).toMatch(/^data:image\/png;base64,/);
  await page.getByRole('button', { name: 'Remover foto' }).click();
  const removal = page.waitForResponse((response) => response.url().endsWith('/api/auth/profile') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  expect((await removal).status()).toBe(200);
  const afterRemoval = await request.post('/api/auth/login', { data: { email, senha: initial.senha } });
  const removed: AuthResponseDTO = await afterRemoval.json();
  expect(removed.data?.usuario.fotoPerfilUrl).toBeNull();
  await page.getByRole('radio', { name: 'Usar a aplicação por curiosidade' }).check();
  await page.getByLabel('Profissão (opcional)').fill('');
  await page.getByLabel('LinkedIn (opcional)').fill('');
  const curiositySave = page.waitForResponse((response) => response.url().endsWith('/api/auth/profile') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  const curiosityProfile = await (await curiositySave).json();
  expect(curiosityProfile.data).toMatchObject({ profissao: null, linkedin: null, intuitoUso: 'CURIOSIDADE' });
  await expect(page.getByText('NE', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Salvar alterações' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/wormif-perfil-mobile.png', fullPage: true });
});

test('campos profissionais opcionais apenas para curiosidade', async ({ request }) => {
  const { nome, email, senha, intuitoUso, permiteAnalisePorTerceiros } = profileData();
  const initial = { nome, email, senha, intuitoUso, permiteAnalisePorTerceiros };
  const registered = await request.post('/api/auth/register', { data: initial });
  expect(registered.status()).toBe(201);
  const auth: AuthResponseDTO = await registered.json();
  expect(auth.data?.usuario).toMatchObject({ profissao: null, linkedin: null });
  const headers = { Authorization: `Bearer ${auth.data?.token}` };
  const collaborator = { ...initial, intuitoUso: 'ANALISAR_OUTRAS_PESSOAS' };
  expect((await request.put('/api/auth/profile', { headers, data: collaborator })).status()).toBe(400);
  expect((await request.post('/api/auth/register', { data: { ...collaborator, email: `colaborador-${crypto.randomUUID()}@example.com` } })).status()).toBe(400);
  expect((await request.post('/api/auth/register', { data: { ...initial, nome: '' } })).status()).toBe(400);
});

test('edicao exige sessao e rejeita dados invalidos e email duplicado', async ({ request }) => {
  const initial = profileData();
  const register = await request.post('/api/auth/register', { data: initial });
  expect(register.status()).toBe(201);
  const auth: AuthResponseDTO = await register.json();
  expect(auth.data?.usuario.fotoPerfilUrl).toBeNull();
  const headers = { Authorization: `Bearer ${auth.data?.token}` };
  expect((await request.put('/api/auth/profile', { data: initial })).status()).toBe(401);
  for (const patch of [{ nome: '' }, { linkedin: 'https://example.com' }, { fotoPerfilUrl: 'invalid' }, { intuitoUso: 'invalid' }, { permiteAnalisePorTerceiros: 'true' }]) {
    expect((await request.put('/api/auth/profile', { headers, data: { ...initial, ...patch } })).status()).toBe(400);
  }
  const other = profileData();
  expect((await request.post('/api/auth/register', { data: other })).status()).toBe(201);
  expect((await request.put('/api/auth/profile', { headers, data: { ...initial, email: other.email } })).status()).toBe(400);
  const otherLogin = await request.post('/api/auth/login', { data: { email: other.email, senha: other.senha } });
  const otherAuth: AuthResponseDTO = await otherLogin.json();
  expect((await request.put('/api/auth/profile', {
    headers, data: { ...initial, id: otherAuth.data?.usuario.id, nome: 'Somente meu perfil' }
  })).status()).toBe(200);
  const unaffected = await request.post('/api/auth/login', { data: { email: other.email, senha: other.senha } });
  const unaffectedAuth: AuthResponseDTO = await unaffected.json();
  expect(unaffectedAuth.data?.usuario.nome).toBe(other.nome);
});
