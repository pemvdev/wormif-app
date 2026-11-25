import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';

export interface DiagnosticoResponseDTO {
  success: boolean;
  data?: {
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
  error?: string;
}
