import type { StatusDiagnostico } from '../model/Diagnostico';
import type { EstagioDiagnostico } from '../../Dominio/EstagioDiagnostico';

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
  validadoPorEspecialista: boolean;
  totalRespostas?: number;
  latitude?: number | null;
  longitude?: number | null;
  localizacaoLabel?: string | null;
}
