import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';
export type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';

export type StatusDiagnostico = 'processando' | 'concluido' | 'erro';
export interface Diagnostico {
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
}

export const estagioDiagnosticoLabels: Record<EstagioDiagnostico, string> = {
  ovo: 'Ovo',
  larva: 'Larva',
  ninfa: 'Ninfa',
  pupa: 'Pupa',
  juvenil: 'Juvenil',
  subadulto: 'Sub-adulto',
  adulto: 'Adulto',
  desconhecido: 'Não identificado'
};
