import { test, expect, type APIRequestContext } from '@playwright/test';
import type { AuthResponseDTO } from '../../3.Arquitetura/Front-end/dto/AuthDTO';
import type { AnalisesExternasPaginaDTO } from '../../3.Arquitetura/Front-end/dto/AnaliseExternaDTO';
import { buildImagePayload } from './helpers/api';

async function createUser(request: APIRequestContext, collaborative: boolean, shared: boolean) {
  const profile = {
    nome: `Autor ${crypto.randomUUID()}`,
    email: `externas-${crypto.randomUUID()}@example.com`,
    senha: 'senha123',
    profissao: collaborative ? 'Pesquisador' : null,
    linkedin: collaborative ? 'https://www.linkedin.com/in/teste' : null,
    intuitoUso: collaborative ? 'ANALISAR_OUTRAS_PESSOAS' : 'CURIOSIDADE',
    permiteAnalisePorTerceiros: shared
  };
  const response = await request.post('/api/auth/register', { data: profile });
  expect(response.status()).toBe(201);
  const auth: AuthResponseDTO = await response.json();
  if (!auth.data) throw new Error('Cadastro de teste falhou.');
  return { profile, headers: { Authorization: `Bearer ${auth.data.token}` } };
}

async function createAnalysis(request: APIRequestContext, headers: Record<string, string>, species: string, withImage = true) {
  const response = await request.post('/api/diagnostico/registrar', {
    headers, data: {
      especie: species, nomeComum: 'Lagarta compartilhada', diagnosticoBack: 'larva',
      nivelConfianca: 0.92, descricao: 'Resultado de identificação da IA.',
      caracteristicas: ['Corpo segmentado'], habitat: 'Culturas agrícolas.',
      ...(withImage ? { imagem: buildImagePayload() } : {})
    }
  });
  expect(response.status()).toBe(200);
  const body: { data: { id: number } } = await response.json();
  return body.data.id;
}

test('consentimento, acesso de colaboradores e isolamento de propriedade', async ({ request }) => {
  const reviewer = await createUser(request, true, true);
  const author = await createUser(request, false, true);
  const privateAuthor = await createUser(request, false, false);
  const marker = crypto.randomUUID();
  const sharedId = await createAnalysis(request, author.headers, `Compartilhada ${marker}`);
  const privateId = await createAnalysis(request, privateAuthor.headers, `Privada ${marker}`);
  const ownId = await createAnalysis(request, reviewer.headers, `Própria ${marker}`);
  const url = `/api/diagnostico/externas?q=${marker}`;
  expect((await request.get(url)).status()).toBe(401);
  expect((await request.get(url, { headers: author.headers })).status()).toBe(403);
  expect((await request.get(`/api/diagnostico/externas/${sharedId}`, { headers: author.headers })).status()).toBe(403);
  const list = await request.get(url, { headers: reviewer.headers });
  expect(list.status()).toBe(200);
  const body: { data: AnalisesExternasPaginaDTO } = await list.json();
  expect(body.data.items.map((item) => item.id)).toEqual([sharedId]);
  expect(body.data.items[0].autorNome).toBe(author.profile.nome);
  expect(body.data.items[0]).not.toHaveProperty('email');
  expect(body.data.items[0]).not.toHaveProperty('userId');
  expect((await request.get(`/api/diagnostico/externas/${sharedId}`, { headers: reviewer.headers })).status()).toBe(200);
  const image = await request.get(`/api/diagnostico/${sharedId}/imagem`, { headers: reviewer.headers });
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/png');
  expect((await image.body()).toString('base64')).toBe(buildImagePayload().imageBase64);
  expect((await request.get(`/api/diagnostico/${sharedId}/imagem`)).status()).toBe(401);
  expect((await request.get(`/api/diagnostico/${privateId}/imagem`, { headers: reviewer.headers })).status()).toBe(404);
  const palpite = { especie: 'Espécie proposta', estagio: 'adulto', comentario: 'Minha observação.' };
  const palpiteUrl = `/api/diagnostico/externas/${sharedId}/palpite`;
  expect((await request.put(palpiteUrl, { data: palpite })).status()).toBe(401);
  expect((await request.put(palpiteUrl, { headers: author.headers, data: palpite })).status()).toBe(403);
  expect((await request.put(`/api/diagnostico/externas/${ownId}/palpite`, { headers: reviewer.headers, data: palpite })).status()).toBe(404);
  expect((await request.put(`/api/diagnostico/externas/${privateId}/palpite`, { headers: reviewer.headers, data: palpite })).status()).toBe(404);
  for (const invalid of [{ especie: '' }, { estagio: 'invalido' }, { comentario: 'a'.repeat(2001) }]) {
    expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: { ...palpite, ...invalid } })).status()).toBe(400);
  }
  expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: palpite })).status()).toBe(200);
  expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: { ...palpite, comentario: 'Palpite editado.' } })).status()).toBe(200);
  const details = await request.get(`/api/diagnostico/externas/${sharedId}`, { headers: reviewer.headers });
  const saved = await details.json();
  expect(saved.data.palpites).toHaveLength(1);
  expect(saved.data.meuPalpite).toMatchObject({ ...palpite, comentario: 'Palpite editado.', autorNome: reviewer.profile.nome });
  expect(saved.data.diagnosticoBack).toBe('larva');
  expect(saved.data.validadoPorEspecialista).toBe(false);
  const received = await request.get(`/api/diagnostico/${sharedId}/palpites`, { headers: author.headers });
  expect(received.status()).toBe(200);
  expect((await received.json()).data).toHaveLength(1);
  expect((await request.get(`/api/diagnostico/${sharedId}/palpites`, { headers: reviewer.headers })).status()).toBe(404);
  for (const id of [privateId, ownId]) {
    expect((await request.get(`/api/diagnostico/externas/${id}`, { headers: reviewer.headers })).status()).toBe(404);
  }
  expect((await request.get(`/api/diagnostico/${sharedId}`, { headers: reviewer.headers })).status()).toBe(404);
  expect((await request.delete(`/api/diagnostico/${sharedId}`, { headers: reviewer.headers })).status()).toBe(404);
  expect((await request.put('/api/auth/profile', { headers: author.headers,
    data: { ...author.profile, permiteAnalisePorTerceiros: false }
  })).status()).toBe(200);
  expect((await request.get(`/api/diagnostico/externas/${sharedId}`, { headers: reviewer.headers })).status()).toBe(404);
  expect((await request.get(`/api/diagnostico/${sharedId}/imagem`, { headers: reviewer.headers })).status()).toBe(404);
  expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: palpite })).status()).toBe(404);
  const revoked = await request.get(url, { headers: reviewer.headers });
  expect((await revoked.json()).data.items).toEqual([]);
  expect((await request.put('/api/auth/profile', { headers: reviewer.headers,
    data: { ...reviewer.profile, intuitoUso: 'CURIOSIDADE' }
  })).status()).toBe(200);
  expect((await request.get(url, { headers: reviewer.headers })).status()).toBe(403);
  expect((await request.get('/api/diagnostico/externas?page=-1', { headers: reviewer.headers })).status()).toBe(400);
});

test('busca e paginacao das analises externas', async ({ request }) => {
  const reviewer = await createUser(request, true, false);
  const author = await createUser(request, false, true);
  const marker = crypto.randomUUID();
  for (let index = 0; index < 21; index += 1) {
    await createAnalysis(request, author.headers, `Espécie ${marker} ${index}`, false);
  }
  const firstResponse = await request.get(`/api/diagnostico/externas?q=${marker}`, { headers: reviewer.headers });
  const first: { data: AnalisesExternasPaginaDTO } = await firstResponse.json();
  expect(first.data.items).toHaveLength(20);
  expect(first.data.hasMore).toBe(true);
  expect(first.data.items[0].temImagem).toBe(false);
  const secondResponse = await request.get(`/api/diagnostico/externas?q=${marker}&page=2`, { headers: reviewer.headers });
  const second: { data: AnalisesExternasPaginaDTO } = await secondResponse.json();
  expect(second.data.items).toHaveLength(1);
  expect(second.data.hasMore).toBe(false);
  expect(first.data.items.map((item) => item.id)).not.toContain(second.data.items[0].id);
});

test('menu, busca, detalhes, falha e visualizacao mobile', async ({ page, request }) => {
  const reviewer = await createUser(request, true, false);
  const author = await createUser(request, false, true);
  const marker = crypto.randomUUID();
  const species = `Espécie externa ${marker}`;
  const id = await createAnalysis(request, author.headers, species);
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(reviewer.profile.email);
  await page.getByLabel('Senha', { exact: true }).fill(reviewer.profile.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await page.getByRole('link', { name: 'Análises externas', exact: true }).click();
  await page.getByLabel('Buscar análises externas').fill(marker);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: species, exact: true })).toBeVisible();
  await expect(page.getByAltText('Foto utilizada na análise', { exact: true })).toBeVisible();
  await expect.poll(() => page.getByAltText('Foto utilizada na análise', { exact: true }).evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: '/tmp/wormif-externas-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Ver análise', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/analises-externas/${id}$`));
  await expect(page.getByText('Resultado de identificação da IA.', { exact: true })).toBeVisible();
  await expect(page.getByText(author.profile.nome, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(page.getByAltText('Foto utilizada na análise ampliada')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await page.getByLabel('Espécie', { exact: true }).fill('Palpite da comunidade');
  await page.getByLabel('Estágio de vida', { exact: true }).selectOption('adulto');
  await page.getByLabel('Comentário (opcional)').fill('A foto sugere um espécime adulto.');
  await page.getByRole('button', { name: 'Salvar palpite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Atualizar palpite', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Espécie', { exact: true })).toHaveValue('Palpite da comunidade');
  await expect(page.locator('p').filter({ hasText: 'A foto sugere um espécime adulto.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Excluir/ })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.getByRole('complementary', { name: 'Menu principal' }).evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/wormif-externas-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Voltar às análises' }).click();
  await page.getByLabel('Buscar análises externas').fill(`sem-resultados-${crypto.randomUUID()}`);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('Nenhuma análise encontrada para esta busca.')).toBeVisible();
  await page.route('**/api/diagnostico/externas?*', (route) => route.fulfill({ status: 500,
    json: { success: false, error: 'Falha temporária.' }
  }), { times: 1 });
  await page.getByRole('button', { name: 'Atualizar análises' }).click();
  await expect(page.getByRole('alert')).toHaveText('Falha temporária.');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByText('Nenhuma análise encontrada para esta busca.')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(author.profile.email);
  await page.getByLabel('Senha', { exact: true }).fill(author.profile.senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/upload$/);
  await expect(page.getByRole('link', { name: 'Análises externas', exact: true })).toHaveCount(0);
  await page.goto('/analises-externas');
  await expect(page.getByRole('alert')).toContainText('Esta área está disponível');
  await page.goto('/historico');
  await page.getByRole('button', { name: 'Ver detalhes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Palpites recebidos' })).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'A foto sugere um espécime adulto.' })).toBeVisible();
});

test('foto da analise de visitante e preservada apos cadastro', async ({ page, request }) => {
  const reviewer = await createUser(request, true, false);
  const species = `Visitante ${crypto.randomUUID()}`;
  await page.route('**/api/diagnostico/analisar', (route) => route.fulfill({ json: {
    success: true, data: {
      especie: species, nomeComum: 'Lagarta visitante', diagnosticoBack: 'larva',
      nivelConfianca: 0.9, descricao: 'Identificação de visitante.',
      caracteristicas: ['Corpo segmentado'], habitat: 'Culturas agrícolas.', cicloDeVida: 'Ovo, larva, pupa, adulto.'
    }
  } }));
  await page.goto('/upload');
  await page.locator('input[type="file"]').setInputFiles('src/4.Teste/e2e/fixtures/sample.png');
  await page.getByRole('button', { name: 'Continuar para identificação' }).click();
  await expect(page.getByRole('button', { name: /Ver resultado/ })).toBeEnabled();
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill('Visitante cadastrado');
  await page.getByLabel('E-mail', { exact: true }).fill(`visitante-${crypto.randomUUID()}@example.com`);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('switch').check();
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page).toHaveURL(/\/upload$/);
  const list = await request.get(`/api/diagnostico/externas?q=${encodeURIComponent(species)}`, { headers: reviewer.headers });
  const body: { data: AnalisesExternasPaginaDTO } = await list.json();
  expect(body.data.items).toHaveLength(1);
  expect(body.data.items[0].temImagem).toBe(true);
  const image = await request.get(`/api/diagnostico/${body.data.items[0].id}/imagem`, { headers: reviewer.headers });
  expect(image.status()).toBe(200);
  expect((await image.body()).toString('base64')).toBe(buildImagePayload().imageBase64);
});
