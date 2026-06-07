export type StatusDiagnostico = 'processando' | 'concluido' | 'erro';

export type DiagnosticoFront =
  | 'ovo'
  | 'larva'
  | 'ninfa'
  | 'pupa'
  | 'juvenil'
  | 'subadulto'
  | 'adulto'
  | 'desconhecido';

export interface Diagnostico {
  id: number;
  data: string;
  status: StatusDiagnostico;
  nivelConfianca: number;
  diagnosticoFront: DiagnosticoFront;
  especie: string;
  nomeComum: string;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  validadoPorEspecialista: boolean;
}

export const diagnosticoFrontLabels: Record<DiagnosticoFront, string> = {
  ovo: 'Ovo',
  larva: 'Larva',
  ninfa: 'Ninfa',
  pupa: 'Pupa',
  juvenil: 'Juvenil',
  subadulto: 'Sub-adulto',
  adulto: 'Adulto',
  desconhecido: 'Não identificado'
};
