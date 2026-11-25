import type { IntuitoUsoAplicacao } from '../dto/AuthDTO';

export type DadosPerfilUsuario = {
  nome: string;
  email: string;
  profissao: string | null;
  fotoPerfilUrl: string | null;
  linkedin: string | null;
  intuitoUso: IntuitoUsoAplicacao | null;
  permiteAnalisePorTerceiros: boolean;
};

export class Usuario {
  #id: string;
  #nome: string;
  #email: string;
  #senhaHash: string;
  #senhaSalt: string;
  #profissao: string | null;
  #fotoPerfilUrl: string | null;
  #linkedin: string | null;
  #intuitoUso: IntuitoUsoAplicacao | null;
  #permiteAnalisePorTerceiros: boolean;
  #dataCadastro: string;

  constructor(
    id: string,
    nome: string,
    email: string,
    senhaHash: string,
    senhaSalt: string,
    profissao: string | null,
    fotoPerfilUrl: string | null,
    linkedin: string | null,
    intuitoUso: IntuitoUsoAplicacao | null,
    permiteAnalisePorTerceiros: boolean,
    dataCadastro: string
  ) {
    this.#id = id;
    this.#nome = nome;
    this.#email = email;
    this.#senhaHash = senhaHash;
    this.#senhaSalt = senhaSalt;
    this.#profissao = profissao;
    this.#fotoPerfilUrl = fotoPerfilUrl;
    this.#linkedin = linkedin;
    this.#intuitoUso = intuitoUso;
    this.#permiteAnalisePorTerceiros = permiteAnalisePorTerceiros;
    this.#dataCadastro = dataCadastro;
  }

  get id(): string { return this.#id; }
  get nome(): string { return this.#nome; }
  get email(): string { return this.#email; }
  get senhaHash(): string { return this.#senhaHash; }
  get senhaSalt(): string { return this.#senhaSalt; }
  get profissao(): string | null { return this.#profissao; }
  get fotoPerfilUrl(): string | null { return this.#fotoPerfilUrl; }
  get linkedin(): string | null { return this.#linkedin; }
  get intuitoUso(): IntuitoUsoAplicacao | null { return this.#intuitoUso; }
  get permiteAnalisePorTerceiros(): boolean { return this.#permiteAnalisePorTerceiros; }
  get dataCadastro(): string { return this.#dataCadastro; }

  atualizarPerfil(dados: DadosPerfilUsuario): void {
    this.#nome = dados.nome;
    this.#email = dados.email;
    this.#profissao = dados.profissao;
    this.#fotoPerfilUrl = dados.fotoPerfilUrl;
    this.#linkedin = dados.linkedin;
    this.#intuitoUso = dados.intuitoUso;
    this.#permiteAnalisePorTerceiros = dados.permiteAnalisePorTerceiros;
  }

  atualizarSenhaHash(senhaHash: string): void {
    this.#senhaHash = senhaHash;
  }
}
