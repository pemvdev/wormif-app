export type StatusDiagnostico = 'processando' | 'concluido' | 'erro';

export type EstagioVida =
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
  estagioVida: EstagioVida;
  especie: string;
  nomeComum: string;
  descricao: string;
  caracteristicas: string[];
  habitat: string;
  validadoPorEspecialista: boolean;
}

export const estagioVidaLabels: Record<EstagioVida, string> = {
  ovo: 'Ovo',
  larva: 'Larva',
  ninfa: 'Ninfa',
  pupa: 'Pupa',
  juvenil: 'Juvenil',
  subadulto: 'Sub-adulto',
  adulto: 'Adulto',
  desconhecido: 'Não identificado'
};
