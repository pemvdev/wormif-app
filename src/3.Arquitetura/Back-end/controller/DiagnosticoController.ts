import { Hono } from 'hono';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import { palpiteSchema, respostaSchema } from '../dto/PalpiteDTO';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { ServiceContainer } from '../config/ServiceContainer';
import { authMiddleware } from '../middleware/authMiddleware';

const diagnosticoController = new Hono<{ Bindings: Env; Variables: { sessao?: { token: string; usuarioId: string } } }>();
diagnosticoController.use('*', async (c, next) => c.req.path.endsWith('/analisar') ? next() : authMiddleware(c, next));

function parseIdParam(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

diagnosticoController.get('/historico', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  try {
    const diagnosticoService = ServiceContainer.createDiagnosticoService(c.env);
    const historico = await diagnosticoService.listar(sessao.usuarioId);
    return c.json({ success: true, data: historico });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    return c.json({ success: false, error: 'Erro ao consultar histórico' }, 500);
  }
});

diagnosticoController.get('/externas', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const page = Number(c.req.query('page') ?? '1');
  const query = (c.req.query('q') ?? '').trim();
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000 || query.length > 200) {
    return c.json({ success: false, error: 'Parâmetros de busca inválidos.' }, 400);
  }
  try {
    const service = ServiceContainer.createAnalisesExternasService(c.env);
    const data = await service.listar(sessao.usuarioId, query, page);
    if (!data) return c.json({ success: false, error: 'Acesso disponível apenas para colaboradores.' }, 403);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível consultar as análises externas.' }, 500);
  }
});

diagnosticoController.get('/externas/:id', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const service = ServiceContainer.createAnalisesExternasService(c.env);
    if (!await service.podeConsultar(sessao.usuarioId)) {
      return c.json({ success: false, error: 'Acesso disponível apenas para colaboradores.' }, 403);
    }
    const data = await service.buscarPorId(id, sessao.usuarioId);
    if (!data) return c.json({ success: false, error: 'Análise não encontrada ou não compartilhada.' }, 404);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível consultar a análise externa.' }, 500);
  }
});

diagnosticoController.put('/externas/:id/palpite', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = palpiteSchema.safeParse(body);
  if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
  try {
    const service = ServiceContainer.createAnalisesExternasService(c.env);
    if (!await service.podeConsultar(sessao.usuarioId)) {
      return c.json({ success: false, error: 'Apenas colaboradores podem dar palpites.' }, 403);
    }
    if (!await service.salvarPalpite(id, sessao.usuarioId, parsed.data)) {
      return c.json({ success: false, error: 'Análise não encontrada ou não compartilhada.' }, 404);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ success: false, error: 'Não foi possível salvar seu palpite.' }, 500);
  }
});

diagnosticoController.get('/:id/imagem', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const service = ServiceContainer.createDiagnosticoService(c.env);
    const image = await service.obterImagem(id, sessao.usuarioId);
    if (!image) return c.json({ success: false, error: 'Imagem não disponível.' }, 404);
    return new Response(image.body, { headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch {
    return c.json({ success: false, error: 'Não foi possível carregar a imagem.' }, 500);
  }
});

diagnosticoController.put('/:id/localizacao', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  const body: unknown = await c.req.json().catch(() => null);
  if (!id || !body || typeof body !== 'object') return c.json({ success: false, error: 'Dados inválidos.' }, 400);
  const { lat, lng, label } = body as { lat?: unknown; lng?: unknown; label?: unknown };
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90 || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180 || typeof label !== 'string' || label.length > 200) {
    return c.json({ success: false, error: 'Localização inválida.' }, 400);
  }
  try {
    const saved = await ServiceContainer.createDiagnosticoService(c.env).atualizarLocalizacao(id, sessao.usuarioId, lat, lng, label);
    return saved ? c.json({ success: true }) : c.json({ success: false, error: 'Diagnóstico não encontrado.' }, 404);
  } catch { return c.json({ success: false, error: 'Não foi possível salvar a localização.' }, 500); }
});

diagnosticoController.get('/:id/palpites', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const data = await ServiceContainer.createAnalisesExternasService(c.env).listarRecebidos(id, sessao.usuarioId);
    if (!data) return c.json({ success: false, error: 'Análise não encontrada.' }, 404);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível carregar os palpites.' }, 500);
  }
});

diagnosticoController.get('/:id/discussao', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  const cursor = Number(c.req.query('cursor') ?? '0');
  if (!id || !Number.isSafeInteger(cursor) || cursor < 0) return c.json({ success: false, error: 'Parâmetros inválidos.' }, 400);
  try {
    const data = await ServiceContainer.createAnalisesExternasService(c.env).listarDiscussao(id, sessao.usuarioId, cursor);
    if (!data) return c.json({ success: false, error: 'Análise não encontrada ou não compartilhada.' }, 404);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível carregar a discussão.' }, 500);
  }
});

diagnosticoController.post('/:id/discussao', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  const parsed = respostaSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
  try {
    if (!await ServiceContainer.createAnalisesExternasService(c.env).responder(id, sessao.usuarioId, parsed.data)) {
      return c.json({ success: false, error: 'Comentário não encontrado ou análise não compartilhada.' }, 404);
    }
    return c.json({ success: true }, 201);
  } catch {
    return c.json({ success: false, error: 'Não foi possível publicar sua resposta.' }, 500);
  }
});

diagnosticoController.get('/:id', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  const id = parseIdParam(c.req.param('id'));
  if (!id) {
    return c.json({ success: false, error: 'ID inválido' }, 400);
  }

  try {
    const diagnosticoService = ServiceContainer.createDiagnosticoService(c.env);
    const diagnostico = await diagnosticoService.buscarPorId(id, sessao.usuarioId);
    if (!diagnostico) {
      return c.json({ success: false, error: 'Diagnóstico não encontrado' }, 404);
    }
    return c.json({ success: true, data: diagnostico });
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    return c.json({ success: false, error: 'Erro ao buscar diagnóstico' }, 500);
  }
});

diagnosticoController.delete('/:id', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  const id = parseIdParam(c.req.param('id'));
  if (!id) {
    return c.json({ success: false, error: 'ID inválido' }, 400);
  }

  try {
    const diagnosticoService = ServiceContainer.createDiagnosticoService(c.env);
    const removed = await diagnosticoService.excluir(id, sessao.usuarioId);
    if (!removed) {
      return c.json({ success: false, error: 'Diagnóstico não encontrado' }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir diagnóstico:', error);
    return c.json({ success: false, error: 'Erro ao excluir diagnóstico' }, 500);
  }
});

diagnosticoController.post('/registrar', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  try {
    const body = await c.req.json<NonNullable<DiagnosticoResponseDTO['data']> & { imagem?: UploadImagemDTO }>();
    if (!body?.especie || !body?.diagnosticoBack) {
      return c.json({ success: false, error: 'Dados de diagnóstico inválidos' }, 400);
    }

    const storageService = ServiceContainer.createStorageService(c.env);
    if (body.imagem) {
      const validation = await storageService.validarUpload(body.imagem);
      if (!validation.ok) return c.json({ success: false, error: validation.error }, 400);
    }
    const diagnosticoService = ServiceContainer.createDiagnosticoService(c.env);
    const salvo = await diagnosticoService.registrar(sessao.usuarioId, body, body.imagem);
    return c.json({ success: true, data: { id: salvo.id } });
  } catch (error) {
    console.error('Erro ao registrar diagnóstico:', error);
    return c.json({ success: false, error: 'Erro ao salvar diagnóstico' }, 500);
  }
});

diagnosticoController.post('/analisar', async (c) => {
  const sessao = await ServiceContainer.createAuthService(c.env).resolverSessao(c.req.header('Authorization'));
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ success: false, error: 'API key não configurada' }, 500);
  }

  try {
    const storageService = ServiceContainer.createStorageService(c.env);
    const upload = await storageService.parsearUpload(c.req.raw);
    if (!upload.ok) {
      return c.json({ success: false, error: upload.error }, upload.status);
    }

    const aiService = ServiceContainer.createAIService(c.env);
    const resultado = await aiService.analisarImagem(upload.data.imageBase64, upload.data.mimeType);

    if (resultado.success && resultado.data && sessao) {
      const diagnosticoService = ServiceContainer.createDiagnosticoService(c.env);
      const salvo = await diagnosticoService.registrar(sessao.usuarioId, resultado.data, upload.data);
      return c.json({
        ...resultado,
        data: { ...resultado.data, id: salvo.id }
      });
    }

    return c.json(resultado);
  } catch (error) {
    console.error('Erro no controller:', error);
    return c.json(
      {
        success: false,
        error: 'Erro ao processar requisição'
      },
      500
    );
  }
});

export { diagnosticoController };
