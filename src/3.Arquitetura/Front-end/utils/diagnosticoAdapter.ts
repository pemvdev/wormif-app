import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { DiagnosticoHistoricoDTO } from '../dto/DiagnosticoHistoricoDTO';
import type { AnalysisHistoryItem } from '../context/AppContext';

export type RegistrarDiagnosticoPayload = {
  especie: string;
  nomeComum: string;
  diagnosticoBack: EstagioDiagnostico;
  nivelConfianca: number;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  cicloDeVida: string;
  proximoEstagio?: string;
};

export function frontDataToRegistrarPayload(
  data: NonNullable<DiagnosticoResponseDTO['data']>
): RegistrarDiagnosticoPayload {
  const { id: _id, ...payload } = data;
  return payload;
}

export function historicoToHistoryItem(dto: DiagnosticoHistoricoDTO): AnalysisHistoryItem {
  return {
    id: dto.id,
    createdAt: dto.data,
    especie: dto.especie,
    nomeComum: dto.nomeComum,
    diagnosticoBack: dto.diagnosticoBack,
    nivelConfianca: dto.nivelConfianca,
    descricao: dto.descricao,
    caracteristicas: dto.caracteristicas,
    habitat: dto.habitat,
    totalRespostas: dto.totalRespostas ?? 0,
    localizacao: dto.latitude != null && dto.longitude != null ? { lat: dto.latitude, lng: dto.longitude, label: dto.localizacaoLabel ?? `${dto.latitude}, ${dto.longitude}` } : undefined
  };
}

export function historicoToResultado(dto: DiagnosticoHistoricoDTO): DiagnosticoResponseDTO {
  return {
    success: true,
    data: {
      id: dto.id,
      especie: dto.especie,
      nomeComum: dto.nomeComum,
      diagnosticoBack: dto.diagnosticoBack,
      nivelConfianca: dto.nivelConfianca,
      descricao: dto.descricao,
      caracteristicas: dto.caracteristicas,
      habitat: dto.habitat,
      cicloDeVida: 'Consulte referências da espécie para o ciclo completo.',
      proximoEstagio: undefined
    }
  };
}
