import type { UploadImagemDTO } from '../dto/UploadImagemDTO-Back';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO-Back';
import { Diagnostico } from '../model/Diagnostico-Back';
import { DiagnosticoRepository } from '../repository/DiagnosticoRepository';
import { AIService } from './AIService';
import { StorageService } from './StorageService';

export class DiagnosticoService {
  private diagnosticoRepository: DiagnosticoRepository;
  private aiService: AIService;
  private storageService: StorageService;

  constructor(
    diagnosticoRepository: DiagnosticoRepository,
    aiService: AIService,
    storageService: StorageService
  ) {
    this.diagnosticoRepository = diagnosticoRepository;
    this.aiService = aiService;
    this.storageService = storageService;
  }

  async processar(upload: UploadImagemDTO): Promise<DiagnosticoResponseDTO> {
    const storageCheck = await this.storageService.validarUpload(upload);
    if (!storageCheck.ok) {
      return { success: false, error: storageCheck.error };
    }

    const resultado = await this.aiService.analisarImagem(upload.imageBase64, upload.mimeType);

    if (resultado.success && resultado.data) {
      const diagnostico = new Diagnostico(
        0,
        new Date().toISOString(),
        'processando',
        resultado.data.nivelConfianca,
        resultado.data.diagnosticoBack,
        false,
        resultado.data.especie,
        resultado.data.nomeComum,
        resultado.data.descricao,
        resultado.data.caracteristicas,
        resultado.data.habitat
      );
      diagnostico.processar();
      await this.diagnosticoRepository.salvar(diagnostico);
    }

    return resultado;
  }
}
