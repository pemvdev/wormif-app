import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';

export type StatusDiagnostico = 'processando' | 'concluido' | 'erro';
export type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';
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

export class Diagnostico {
  constructor(
    public id: number,
    public data: string,
    public status: StatusDiagnostico,
    public nivelConfianca: number,
    public diagnosticoBack: EstagioDiagnostico,
    public validadoPorEspecialista: boolean,
    public especie: string,
    public nomeComum: string,
    public descricao: string,
    public caracteristicas: string[],
    public habitat: string,
    public userId: string | null = null,
    public imagemKey: string | null = null,
    public latitude: number | null = null,
    public longitude: number | null = null,
    public localizacaoLabel: string | null = null
  ) {}

  processar(): void {
    if (this.status === 'processando') {
      this.status = 'concluido';
    }
  }
}
