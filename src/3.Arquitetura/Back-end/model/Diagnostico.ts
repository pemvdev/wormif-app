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

export class Diagnostico {
  constructor(
    public id: number,
    public data: string,
    public status: StatusDiagnostico,
    public nivelConfianca: number,
    public estagioVida: EstagioVida,
    public validadoPorEspecialista: boolean,
    public especie: string,
    public nomeComum: string,
    public descricao: string,
    public caracteristicas: string[],
    public habitat: string
  ) {}

  processar(): void {
    if (this.status === 'processando') {
      this.status = 'concluido';
    }
  }
}
