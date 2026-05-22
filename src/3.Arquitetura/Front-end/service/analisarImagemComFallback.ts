import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import { mockAnalisarImagem } from '@Front-end/service/MockDiagnosticoService';
import type { DiagnosticoResponseDTO } from '@Front-end/dto/DiagnosticoResponseDTO';

const diagnosticoService = new DiagnosticoService();

export type AnaliseSource = 'api' | 'mock';

export interface AnaliseComFallbackResult {
  response: DiagnosticoResponseDTO;
  source: AnaliseSource;
}

export async function analisarImagemComFallback(
  imageBase64: string,
  mimeType: string,
  fileName: string
): Promise<AnaliseComFallbackResult> {
  try {
    const response = await diagnosticoService.analisar(imageBase64, mimeType, fileName);
    if (response.success && response.data) {
      return { response, source: 'api' };
    }
  } catch {
    // API indisponível — usa mock abaixo
  }

  const response = await mockAnalisarImagem(fileName);
  return { response, source: 'mock' };
}
