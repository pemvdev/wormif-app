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
  desconhecido: 'NÃ£o identificado'
};

export class Diagnostico {
  #id: number;
  #data: string;
  #status: StatusDiagnostico;
  #nivelConfianca: number;
  #diagnosticoBack: EstagioDiagnostico;
  #especie: string;
  #nomeComum: string;
  #descricao: string;
  #caracteristicas: string[];
  #habitat: string;
  #userId: string | null;
  #imagemKey: string | null;
  #latitude: number | null;
  #longitude: number | null;
  #localizacaoLabel: string | null;

  constructor(
    id: number,
    data: string,
    status: StatusDiagnostico,
    nivelConfianca: number,
    diagnosticoBack: EstagioDiagnostico,
    especie: string,
    nomeComum: string,
    descricao: string,
    caracteristicas: string[],
    habitat: string,
    userId: string | null = null,
    imagemKey: string | null = null,
    latitude: number | null = null,
    longitude: number | null = null,
    localizacaoLabel: string | null = null
  ) {
    this.#id = id;
    this.#data = data;
    this.#status = status;
    this.#nivelConfianca = nivelConfianca;
    this.#diagnosticoBack = diagnosticoBack;
    this.#especie = especie;
    this.#nomeComum = nomeComum;
    this.#descricao = descricao;
    this.#caracteristicas = [...caracteristicas];
    this.#habitat = habitat;
    this.#userId = userId;
    this.#imagemKey = imagemKey;
    this.#latitude = latitude;
    this.#longitude = longitude;
    this.#localizacaoLabel = localizacaoLabel;
  }

  get id(): number { return this.#id; }
  get data(): string { return this.#data; }
  get status(): StatusDiagnostico { return this.#status; }
  get nivelConfianca(): number { return this.#nivelConfianca; }
  get diagnosticoBack(): EstagioDiagnostico { return this.#diagnosticoBack; }
  get especie(): string { return this.#especie; }
  get nomeComum(): string { return this.#nomeComum; }
  get descricao(): string { return this.#descricao; }
  get caracteristicas(): string[] { return [...this.#caracteristicas]; }
  get habitat(): string { return this.#habitat; }
  get userId(): string | null { return this.#userId; }
  get imagemKey(): string | null { return this.#imagemKey; }
  get latitude(): number | null { return this.#latitude; }
  get longitude(): number | null { return this.#longitude; }
  get localizacaoLabel(): string | null { return this.#localizacaoLabel; }

  associarImagem(imagemKey: string): void {
    if (!imagemKey.trim()) throw new Error('A chave da imagem nÃ£o pode ser vazia.');
    if (this.#imagemKey) throw new Error('Este diagnÃ³stico jÃ¡ possui uma imagem associada.');
    this.#imagemKey = imagemKey;
  }

  processar(): void {
    if (this.#status === 'processando') {
      this.#status = 'concluido';
    }
  }
}
