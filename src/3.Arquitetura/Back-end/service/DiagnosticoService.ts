import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import { Diagnostico } from '../model/Diagnostico';
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
      const id = this.diagnosticoRepository.proximoId();
      const diagnostico = new Diagnostico(
        id,
        new Date().toISOString(),
        'processando',
        resultado.data.nivelConfianca,
        resultado.data.estagioVida,
        false,
        resultado.data.especie,
        resultado.data.nomeComum,
        resultado.data.descricao,
        resultado.data.caracteristicas,
        resultado.data.habitat
      );
      diagnostico.processar();
      this.diagnosticoRepository.salvar(diagnostico);
    }

    return resultado;
  }
}
