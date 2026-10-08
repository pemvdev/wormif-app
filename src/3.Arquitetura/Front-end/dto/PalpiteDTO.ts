import type { DiagnosticoFront } from '../model/Diagnostico';

export interface SalvarPalpiteDTO {
  especie: string;
  estagio: DiagnosticoFront;
  comentario: string;
}

export interface PalpiteDTO extends SalvarPalpiteDTO {
  id: string;
  autorNome: string;
  atualizadoEm: string;
}
