import { ApiClient } from '../api/ApiClient';
import type { RegistrarDiagnosticoPayload } from '../utils/diagnosticoMapper';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';
import type { AnaliseExternaDetalhesDTO, AnalisesExternasPaginaDTO } from '../dto/AnaliseExternaDTO';
import type { PalpiteDTO, SalvarPalpiteDTO } from '../dto/PalpiteDTO';

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

  async listarExternas(query: string, page: number): Promise<AnalisesExternasPaginaDTO> {
    const params = new URLSearchParams({ q: query, page: String(page) });
    const response = await this.apiClient.get<{ success: boolean; data?: AnalisesExternasPaginaDTO; error?: string }>(
      `/diagnostico/externas?${params}`, { allowErrorBody: true }
    ).catch(() => { throw new Error('Não foi possível carregar as análises externas. Tente novamente.'); });
    if (!response.success || !response.data) throw new Error(response.error ?? 'Não foi possível carregar as análises externas.');
    return response.data;
  }

  async buscarExterna(id: number): Promise<AnaliseExternaDetalhesDTO> {
    const response = await this.apiClient.get<{ success: boolean; data?: AnaliseExternaDetalhesDTO; error?: string }>(
      `/diagnostico/externas/${id}`, { allowErrorBody: true }
    ).catch(() => { throw new Error('Não foi possível carregar a análise externa. Tente novamente.'); });
    if (!response.success || !response.data) throw new Error(response.error ?? 'Análise não encontrada.');
    return response.data;
  }

  async buscarImagem(id: number): Promise<Blob> {
    return this.apiClient.getBlob(`/diagnostico/${id}/imagem`);
  }

  async listarPalpitesRecebidos(id: number): Promise<PalpiteDTO[]> {
    const response = await this.apiClient.get<{ success: boolean; data?: PalpiteDTO[]; error?: string }>(
      `/diagnostico/${id}/palpites`, { allowErrorBody: true }
    ).catch(() => { throw new Error('Não foi possível carregar os palpites.'); });
    if (!response.success || !response.data) throw new Error(response.error ?? 'Não foi possível carregar os palpites.');
    return response.data;
  }

  async salvarPalpite(id: number, data: SalvarPalpiteDTO): Promise<void> {
    const response = await this.apiClient.put<{ success: boolean; error?: string }>(
      `/diagnostico/externas/${id}/palpite`, data, { allowErrorBody: true }
    ).catch(() => { throw new Error('Não foi possível salvar seu palpite. Tente novamente.'); });
    if (!response.success) throw new Error(response.error ?? 'Não foi possível salvar seu palpite.');
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

  async registrar(data: RegistrarDiagnosticoPayload & { imagem?: UploadImagemDTO }): Promise<number> {
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
