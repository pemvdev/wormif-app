import type { DiagnosticoBack } from '../model/Diagnostico-Back';

export interface DiagnosticoResponseDTO {
  success: boolean;
  data?: {
    especie: string;
    nomeComum: string;
    diagnosticoBack: DiagnosticoBack;
    nivelConfianca: number;
    descricao: string;
    caracteristicas: string[];
    habitat: string;
    cicloDeVida: string;
    proximoEstagio?: string;
  };
  error?: string;
}
