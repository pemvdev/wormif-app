import { Hono } from 'hono';
import { AIConfig } from '../config/AIConfig';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { AIService } from '../service/AIService';
import { DiagnosticoService } from '../service/DiagnosticoService';
import { StorageService } from '../service/StorageService';

const diagnosticoController = new Hono<{ Bindings: Env }>();

diagnosticoController.post('/analisar', async (c) => {
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
      await diagnosticoService.registrar(resultado.data);
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
