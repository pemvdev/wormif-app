import type { EstagioVida } from '../model/Diagnostico';

export interface DiagnosticoResponseDTO {
  success: boolean;
  data?: {
    especie: string;
    nomeComum: string;
    estagioVida: EstagioVida;
    nivelConfianca: number;
    descricao: string;
    caracteristicas: string[];
    habitat: string;
    cicloDeVida: string;
    proximoEstagio?: string;
  };
  error?: string;
}
