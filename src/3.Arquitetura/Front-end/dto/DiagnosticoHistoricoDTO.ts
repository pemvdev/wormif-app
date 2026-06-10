import type { DiagnosticoFront, StatusDiagnostico } from '../model/Diagnostico';

export interface DiagnosticoHistoricoDTO {
  id: number;
  data: string;
  status: StatusDiagnostico;
  nivelConfianca: number;
  diagnosticoBack: DiagnosticoFront;
  especie: string;
  nomeComum: string;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  validadoPorEspecialista: boolean;
}
