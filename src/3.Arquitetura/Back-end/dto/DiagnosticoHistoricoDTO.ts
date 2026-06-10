import type { DiagnosticoBack, StatusDiagnostico } from '../model/Diagnostico';

export interface DiagnosticoHistoricoDTO {
  id: number;
  data: string;
  status: StatusDiagnostico;
  nivelConfianca: number;
  diagnosticoBack: DiagnosticoBack;
  especie: string;
  nomeComum: string;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  validadoPorEspecialista: boolean;
}
