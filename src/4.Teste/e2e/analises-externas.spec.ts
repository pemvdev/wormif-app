import { test, expect, type APIRequestContext } from '@playwright/test';
import type { AuthResponseDTO } from '../../3.Arquitetura/Front-end/dto/AuthDTO';
import type { AnalisesExternasPaginaDTO } from '../../3.Arquitetura/Front-end/dto/AnaliseExternaDTO';
import type { DiscussaoPaginaDTO } from '../../3.Arquitetura/Front-end/dto/PalpiteDTO';
import { buildImagePayload } from './helpers/api';

const testUserHeaders: Record<string, string>[] = [];

test.afterEach(async ({ request }) => {
  for (const headers of testUserHeaders.splice(0)) {
    const response = await request.get('/api/diagnostico/historico', { headers });
    expect(response.status()).toBe(200);
    const history: { data: { id: number }[] } = await response.json();
    for (const item of history.data) {
      expect((await request.delete(`/api/diagnostico/${item.id}`, { headers })).status()).toBe(200);
    }
  }
});

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
  const headers = { Authorization: `Bearer ${auth.data.token}` };
  testUserHeaders.push(headers);
  return { profile, headers };
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
  test.setTimeout(60_000);
  const reviewer = await createUser(request, true, false);
  const fotoPerfilUrl = `data:image/png;base64,${buildImagePayload().imageBase64}`;
  expect((await request.put('/api/auth/profile', { headers: reviewer.headers,
    data: { ...reviewer.profile, fotoPerfilUrl }
  })).status()).toBe(200);
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
  await expect(page.getByText('Pesquisador', { exact: true })).toBeVisible();
  await expect.poll(() => page.getByAltText(`Foto de ${reviewer.profile.nome}`, { exact: true }).evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: `Ver perfil de ${reviewer.profile.nome}`, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: reviewer.profile.nome })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', reviewer.profile.linkedin ?? '');
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Responder', exact: true }).click();
  await page.getByLabel(`Responder a ${reviewer.profile.nome}`, { exact: true }).fill('Minha resposta encadeada.');
  await page.getByRole('button', { name: 'Publicar resposta', exact: true }).click();
  await expect(page.getByText('Minha resposta encadeada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recolher respostas' }).click();
  await expect(page.getByText('Minha resposta encadeada.', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Expandir respostas' }).click();
  await expect(page.getByText('Minha resposta encadeada.', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/wormif-discussao-desktop.png', fullPage: true });
  await expect(page.getByRole('button', { name: /Excluir/ })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.getByRole('complementary', { name: 'Menu principal' }).evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  await expect.poll(() => page.getByAltText('Foto utilizada na análise', { exact: true }).evaluate((image) => image instanceof HTMLImageElement && image.naturalWidth > 0)).toBe(true);
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
  await expect(page.getByText('Minha resposta encadeada.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Responder', exact: true }).last().click();
  await page.getByLabel(`Responder a ${reviewer.profile.nome}`, { exact: true }).fill('Resposta do autor à resposta.');
  await page.getByRole('button', { name: 'Publicar resposta', exact: true }).click();
  await expect(page.getByText('Resposta do autor à resposta.', { exact: true })).toBeVisible();
  await expect(page.getByText('Profissão não informada', { exact: true })).toBeVisible();
});

test('discussao compartilhada, respostas aninhadas, perfis e paginacao sem perder comentarios', async ({ request }) => {
  test.setTimeout(90_000);
  const author = await createUser(request, false, true);
  const reviewer = await createUser(request, true, false);
  const observer = await createUser(request, true, false);
  const outsider = await createUser(request, false, true);
  const id = await createAnalysis(request, author.headers, `Discussão ${crypto.randomUUID()}`, false);
  const otherId = await createAnalysis(request, author.headers, `Outra ${crypto.randomUUID()}`, false);
  const url = `/api/diagnostico/${id}/discussao`;
  const palpiteUrl = `/api/diagnostico/externas/${id}/palpite`;
  expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: {
    especie: 'Hipótese inicial', estagio: 'larva', comentario: 'Palpite principal'
  } })).status()).toBe(200);
  const first: { data: DiscussaoPaginaDTO } = await (await request.get(url, { headers: observer.headers })).json();
  const root = first.data.items[0];
  expect(root.autor).toMatchObject({ nome: reviewer.profile.nome, profissao: 'Pesquisador', linkedin: reviewer.profile.linkedin });
  expect(root.autor).not.toHaveProperty('email');
  expect(root.autor).not.toHaveProperty('senha');
  expect((await request.get(url)).status()).toBe(401);
  expect((await request.get(url, { headers: outsider.headers })).status()).toBe(404);
  expect((await request.get(`${url}?cursor=-1`, { headers: reviewer.headers })).status()).toBe(400);
  const reply = { parentId: root.id, comentario: 'Resposta do autor' };
  expect((await request.post(url, { data: reply })).status()).toBe(401);
  expect((await request.post(url, { headers: outsider.headers, data: reply })).status()).toBe(404);
  expect((await request.post(`/api/diagnostico/${otherId}/discussao`, { headers: reviewer.headers, data: reply })).status()).toBe(404);
  for (const invalid of [{ parentId: 'inválido' }, { comentario: ' ' }, { comentario: 'x'.repeat(2001) }]) {
    expect((await request.post(url, { headers: reviewer.headers, data: { ...reply, ...invalid } })).status()).toBe(400);
  }
  expect((await request.post(url, { headers: author.headers, data: reply })).status()).toBe(201);
  const updated: { data: DiscussaoPaginaDTO } = await (await request.get(url, { headers: observer.headers })).json();
  const answer = updated.data.items[1];
  expect(answer.parentId).toBe(root.id);
  expect(answer.autor.nome).toBe(author.profile.nome);
  for (let index = 0; index < 100; index++) {
    expect((await request.post(url, { headers: reviewer.headers, data: {
      parentId: answer.id, comentario: `Resposta aninhada ${index}`
    } })).status()).toBe(201);
  }
  expect((await request.put(palpiteUrl, { headers: reviewer.headers, data: {
    especie: 'Hipótese editada', estagio: 'adulto', comentario: 'Palpite atualizado'
  } })).status()).toBe(200);
  const pageOne: { data: DiscussaoPaginaDTO } = await (await request.get(url, { headers: observer.headers })).json();
  expect(pageOne.data.items).toHaveLength(100);
  expect(pageOne.data.items[0]).toMatchObject({ id: root.id, especie: 'Hipótese editada' });
  expect(pageOne.data.nextCursor).not.toBeNull();
  const pageTwo: { data: DiscussaoPaginaDTO } = await (await request.get(`${url}?cursor=${pageOne.data.nextCursor}`, { headers: observer.headers })).json();
  expect(pageTwo.data.items).toHaveLength(2);
  expect(pageTwo.data.nextCursor).toBeNull();
  expect(new Set([...pageOne.data.items, ...pageTwo.data.items].map((item) => item.id)).size).toBe(102);
  expect(pageTwo.data.items[1].parentId).toBe(answer.id);
  expect((await request.put('/api/auth/profile', { headers: author.headers, data: {
    ...author.profile, permiteAnalisePorTerceiros: false
  } })).status()).toBe(200);
  expect((await request.get(url, { headers: observer.headers })).status()).toBe(404);
  expect((await request.post(url, { headers: reviewer.headers, data: reply })).status()).toBe(404);
  expect((await request.get(url, { headers: author.headers })).status()).toBe(200);
});

test('foto da analise de visitante e preservada apos cadastro', async ({ page, request }) => {
  test.setTimeout(60_000);
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
  await expect(page.getByText(species, { exact: true })).toBeVisible();
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill('Visitante cadastrado');
  await page.getByLabel('E-mail', { exact: true }).fill(`visitante-${crypto.randomUUID()}@example.com`);
  await page.getByLabel('Senha', { exact: true }).fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('switch').check();
  const registration = page.waitForResponse((response) => response.url().endsWith('/api/auth/register'));
  const synced = page.waitForResponse((response) => response.url().endsWith('/api/diagnostico/registrar'));
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  const registrationBody: AuthResponseDTO = await (await registration).json();
  if (registrationBody.data) testUserHeaders.push({ Authorization: `Bearer ${registrationBody.data.token}` });
  expect(registrationBody.data?.usuario.permiteAnalisePorTerceiros).toBe(true);
  const syncedResponse = await synced;
  expect(syncedResponse.status()).toBe(200);
  expect(syncedResponse.request().postDataJSON().especie).toBe(species);
  await expect(page).toHaveURL(/\/upload$/);
  const list = await request.get(`/api/diagnostico/externas?q=${encodeURIComponent(species)}`, { headers: reviewer.headers });
  const body: { data: AnalisesExternasPaginaDTO } = await list.json();
  expect(body.data.items).toHaveLength(1);
  expect(body.data.items[0].temImagem).toBe(true);
  const image = await request.get(`/api/diagnostico/${body.data.items[0].id}/imagem`, { headers: reviewer.headers });
  expect(image.status()).toBe(200);
  expect((await image.body()).toString('base64')).toBe(buildImagePayload().imageBase64);
});
