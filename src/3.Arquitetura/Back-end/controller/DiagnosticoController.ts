import { Hono } from 'hono';
import { AIConfig } from '../config/AIConfig';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { AIService } from '../service/AIService';
import { AuthService } from '../service/AuthService';
import { DiagnosticoService } from '../service/DiagnosticoService';
import { StorageService } from '../service/StorageService';
import { AnalisesExternasService } from '../service/AnalisesExternasService';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { PalpiteRepository } from '../repository/PalpiteRepository';
import { palpiteSchema } from '../dto/PalpiteDTO';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';

const diagnosticoController = new Hono<{ Bindings: Env }>();

function createExternalService(database: D1Database) {
  return new AnalisesExternasService(new DiagnosticoRepository(database), new UsuarioRepository(database), new PalpiteRepository(database));
}

function parseIdParam(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function requireSession(c: { env: Env; req: { header: (name: string) => string | undefined } }) {
  const authService = new AuthService(c.env.DB);
  const sessao = await authService.resolverSessao(c.req.header('Authorization'));
  if (!sessao) {
    return null;
  }
  return sessao;
}

diagnosticoController.get('/historico', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  try {
    const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB));
    const historico = await diagnosticoService.listar(sessao.usuarioId);
    return c.json({ success: true, data: historico });
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    return c.json({ success: false, error: 'Erro ao consultar histórico' }, 500);
  }
});

diagnosticoController.get('/externas', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const page = Number(c.req.query('page') ?? '1');
  const query = (c.req.query('q') ?? '').trim();
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000 || query.length > 200) {
    return c.json({ success: false, error: 'Parâmetros de busca inválidos.' }, 400);
  }
  try {
    const service = createExternalService(c.env.DB);
    const data = await service.listar(sessao.usuarioId, query, page);
    if (!data) return c.json({ success: false, error: 'Acesso disponível apenas para colaboradores.' }, 403);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível consultar as análises externas.' }, 500);
  }
});

diagnosticoController.get('/externas/:id', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const service = createExternalService(c.env.DB);
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
  const sessao = await requireSession(c);
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = palpiteSchema.safeParse(body);
  if (!parsed.success) return c.json({ success: false, error: parsed.error.issues[0].message }, 400);
  try {
    const service = createExternalService(c.env.DB);
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
  const sessao = await requireSession(c);
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const repository = new DiagnosticoRepository(c.env.DB);
    const own = await repository.buscarPorId(id, sessao.usuarioId);
    const external = own ? null : await repository.buscarExterna(id, sessao.usuarioId);
    const key = own?.imagemKey ?? external?.diagnostico.imagemKey;
    if (!key) return c.json({ success: false, error: 'Imagem não disponível.' }, 404);
    const image = await c.env.R2_BUCKET.get(key);
    if (!image) return c.json({ success: false, error: 'Imagem não disponível.' }, 404);
    return new Response(image.body, { headers: {
      'Content-Type': image.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
    } });
  } catch {
    return c.json({ success: false, error: 'Não foi possível carregar a imagem.' }, 500);
  }
});

diagnosticoController.get('/:id/palpites', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) return c.json({ success: false, error: 'Não autenticado' }, 401);
  const id = parseIdParam(c.req.param('id'));
  if (!id) return c.json({ success: false, error: 'ID inválido' }, 400);
  try {
    const data = await createExternalService(c.env.DB).listarRecebidos(id, sessao.usuarioId);
    if (!data) return c.json({ success: false, error: 'Análise não encontrada.' }, 404);
    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Não foi possível carregar os palpites.' }, 500);
  }
});

diagnosticoController.get('/:id', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  const id = parseIdParam(c.req.param('id'));
  if (!id) {
    return c.json({ success: false, error: 'ID inválido' }, 400);
  }

  try {
    const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB));
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
  const sessao = await requireSession(c);
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  const id = parseIdParam(c.req.param('id'));
  if (!id) {
    return c.json({ success: false, error: 'ID inválido' }, 400);
  }

  try {
    const repository = new DiagnosticoRepository(c.env.DB);
    const existing = await repository.buscarPorId(id, sessao.usuarioId);
    const diagnosticoService = new DiagnosticoService(repository);
    const removed = await diagnosticoService.excluir(id, sessao.usuarioId);
    if (!removed) {
      return c.json({ success: false, error: 'Diagnóstico não encontrado' }, 404);
    }
    if (existing?.imagemKey) {
      c.executionCtx.waitUntil(c.env.R2_BUCKET.delete(existing.imagemKey));
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir diagnóstico:', error);
    return c.json({ success: false, error: 'Erro ao excluir diagnóstico' }, 500);
  }
});

diagnosticoController.post('/registrar', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  try {
    const body = await c.req.json<NonNullable<DiagnosticoResponseDTO['data']> & { imagem?: UploadImagemDTO }>();
    if (!body?.especie || !body?.diagnosticoBack) {
      return c.json({ success: false, error: 'Dados de diagnóstico inválidos' }, 400);
    }

    const storageService = new StorageService(c.env.R2_BUCKET);
    if (body.imagem) {
      const validation = await storageService.validarUpload(body.imagem);
      if (!validation.ok) return c.json({ success: false, error: validation.error }, 400);
    }
    const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB), storageService);
    const salvo = await diagnosticoService.registrar(sessao.usuarioId, body, body.imagem);
    return c.json({ success: true, data: { id: salvo.id } });
  } catch (error) {
    console.error('Erro ao registrar diagnóstico:', error);
    return c.json({ success: false, error: 'Erro ao salvar diagnóstico' }, 500);
  }
});

diagnosticoController.post('/analisar', async (c) => {
  const sessao = await requireSession(c);
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ success: false, error: 'API key não configurada' }, 500);
  }

  try {
    const storageService = new StorageService(c.env.R2_BUCKET);
    const upload = await storageService.parsearUpload(c.req.raw);
    if (!upload.ok) {
      return c.json({ success: false, error: upload.error }, upload.status);
    }

    const aiService = new AIService(apiKey, new AIConfig());
    const resultado = await aiService.analisarImagem(upload.data.imageBase64, upload.data.mimeType);

    if (resultado.success && resultado.data && sessao) {
      const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB), storageService);
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
