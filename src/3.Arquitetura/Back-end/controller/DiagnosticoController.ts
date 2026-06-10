import { Hono } from 'hono';
import { AIConfig } from '../config/AIConfig';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { AIService } from '../service/AIService';
import { AuthService } from '../service/AuthService';
import { DiagnosticoService } from '../service/DiagnosticoService';
import { StorageService } from '../service/StorageService';

const diagnosticoController = new Hono<{ Bindings: Env }>();

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
    const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB));
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

diagnosticoController.post('/analisar', async (c) => {
  const sessao = await requireSession(c);
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }

  const apiKey = c.env.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({ success: false, error: 'API key não configurada' }, 500);
  }

  try {
    const storageService = new StorageService();
    const upload = await storageService.parsearUpload(c.req.raw);
    if (!upload.ok) {
      return c.json({ success: false, error: upload.error }, upload.status);
    }

    const aiService = new AIService(apiKey, new AIConfig());
    const resultado = await aiService.analisarImagem(upload.data.imageBase64, upload.data.mimeType);

    if (resultado.success && resultado.data) {
      const diagnosticoService = new DiagnosticoService(new DiagnosticoRepository(c.env.DB));
      const salvo = await diagnosticoService.registrar(sessao.usuarioId, resultado.data);
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
