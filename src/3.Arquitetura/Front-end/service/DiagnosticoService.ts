import { ApiClient } from '../api/ApiClient';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';

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
}
