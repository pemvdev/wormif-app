import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';
import type { StatusDiagnostico } from '../model/Diagnostico';

export interface DiagnosticoHistoricoDTO {
  id: number;
  data: string;
  status: StatusDiagnostico;
  nivelConfianca: number;
  diagnosticoBack: EstagioDiagnostico;
  especie: string;
  nomeComum: string;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  totalRespostas?: number;
  latitude?: number | null;
  longitude?: number | null;
  localizacaoLabel?: string | null;
}
