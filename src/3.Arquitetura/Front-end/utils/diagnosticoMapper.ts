import type { DiagnosticoFront } from '../model/Diagnostico';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';
import type { AnalysisHistoryItem } from '../context/AppContext';

type ApiDiagnosticoData = NonNullable<DiagnosticoResponseDTO['data']> & {
  diagnosticoBack?: DiagnosticoFront;
};

export function mapApiResponseToFront(response: DiagnosticoResponseDTO): DiagnosticoResponseDTO {
  if (!response.success || !response.data) {
    return response;
  }

  const data = response.data as ApiDiagnosticoData;
  const diagnosticoFront = data.diagnosticoFront ?? data.diagnosticoBack ?? 'desconhecido';
  const { diagnosticoBack: _ignored, ...rest } = data;

  return {
    success: true,
    data: {
      ...rest,
      diagnosticoFront
    }
  };
}

export function historicoToHistoryItem(dto: DiagnosticoHistoricoDTO): AnalysisHistoryItem {
  return {
    id: dto.id,
    createdAt: dto.data,
    especie: dto.especie,
    nomeComum: dto.nomeComum,
    diagnosticoFront: dto.diagnosticoBack,
    nivelConfianca: dto.nivelConfianca,
    descricao: dto.descricao,
    caracteristicas: dto.caracteristicas,
    habitat: dto.habitat
  };
}

export function historicoToResultado(dto: DiagnosticoHistoricoDTO): DiagnosticoResponseDTO {
  return {
    success: true,
    data: {
      id: dto.id,
      especie: dto.especie,
      nomeComum: dto.nomeComum,
      diagnosticoFront: dto.diagnosticoBack,
      nivelConfianca: dto.nivelConfianca,
      descricao: dto.descricao,
      caracteristicas: dto.caracteristicas,
      habitat: dto.habitat,
      cicloDeVida: 'Consulte referências da espécie para o ciclo completo.',
      proximoEstagio: undefined
    }
  };
}
