import { ApiClient } from '../api/ApiClient';
import type { RegistrarDiagnosticoPayload } from '../utils/diagnosticoMapper';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';

interface HistoricoListResponse {
  success: boolean;
  data?: DiagnosticoHistoricoDTO[];
  error?: string;
}

interface HistoricoItemResponse {
  success: boolean;
  data?: DiagnosticoHistoricoDTO;
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  error?: string;
}

export class DiagnosticoService {
  private apiClient: typeof ApiClient;

  constructor(apiClient: typeof ApiClient = ApiClient) {
    this.apiClient = apiClient;
  }

  async analisar(
    imageBase64: string,
    mimeType: string,
    fileName: string
  ): Promise<DiagnosticoResponseDTO> {
    const payload: UploadImagemDTO = {
      imageBase64,
      mimeType,
      fileName
    };

    return this.apiClient.post<DiagnosticoResponseDTO>('/diagnostico/analisar', payload);
  }

  async listarHistorico(): Promise<DiagnosticoHistoricoDTO[]> {
    const response = await this.apiClient.get<HistoricoListResponse>('/diagnostico/historico');
    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Falha ao consultar histórico');
    }
    return response.data;
  }

  async buscarPorId(id: number): Promise<DiagnosticoHistoricoDTO> {
    const response = await this.apiClient.get<HistoricoItemResponse>(`/diagnostico/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Diagnóstico não encontrado');
    }
    return response.data;
  }

  async excluir(id: number): Promise<void> {
    const response = await this.apiClient.delete<DeleteResponse>(`/diagnostico/${id}`);
    if (!response.success) {
      throw new Error(response.error ?? 'Falha ao excluir diagnóstico');
    }
  }

  async registrar(data: RegistrarDiagnosticoPayload): Promise<number> {
    const response = await this.apiClient.post<{ success: boolean; data?: { id: number }; error?: string }>(
      '/diagnostico/registrar',
      data
    );
    if (!response.success || !response.data?.id) {
      throw new Error(response.error ?? 'Falha ao salvar diagnóstico');
    }
    return response.data.id;
  }
}
