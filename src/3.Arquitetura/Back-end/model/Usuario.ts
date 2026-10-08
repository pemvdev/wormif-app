import type { IntuitoUsoAplicacao } from '../dto/AuthDTO';

export class Usuario {
  constructor(
    public id: string,
    public nome: string,
    public email: string,
    public senhaHash: string,
    public senhaSalt: string,
    public profissao: string | null,
    public fotoPerfilUrl: string | null,
    public linkedin: string | null,
    public intuitoUso: IntuitoUsoAplicacao | null,
    public permiteAnalisePorTerceiros: boolean,
    public dataCadastro: string
  ) {}
}
