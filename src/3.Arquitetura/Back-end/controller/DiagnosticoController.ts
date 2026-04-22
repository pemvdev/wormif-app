import { Hono } from 'hono';
import { AIConfig } from '../config/AIConfig';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { uploadMiddleware } from '../middleware/UploadMiddleware';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { AIService } from '../service/AIService';
import { DiagnosticoService } from '../service/DiagnosticoService';
import { StorageService } from '../service/StorageService';

const diagnosticoController = new Hono<{
  Bindings: Env;
  Variables: { uploadDto: UploadImagemDTO };
}>();

diagnosticoController.post('/analisar', uploadMiddleware, async (c) => {
  const apiKey = c.env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ success: false, error: 'API key não configurada' }, 500);
  }

  try {
    const body = c.get('uploadDto');

    const diagnosticoRepository = new DiagnosticoRepository();
    const storageService = new StorageService();
    const aiService = new AIService(apiKey, new AIConfig());
    const diagnosticoService = new DiagnosticoService(
      diagnosticoRepository,
      aiService,
      storageService
    );

    const resultado = await diagnosticoService.processar(body);
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
