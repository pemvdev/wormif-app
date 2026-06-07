import type { DiagnosticoFront } from '../model/Diagnostico-Front';

export interface DiagnosticoResponseDTO {
  success: boolean;
  data?: {
    especie: string;
    nomeComum: string;
    diagnosticoFront: DiagnosticoFront;
    nivelConfianca: number;
    descricao: string;
    caracteristicas: string[];
    habitat: string;
    cicloDeVida: string;
    proximoEstagio?: string;
  };
  error?: string;
}
