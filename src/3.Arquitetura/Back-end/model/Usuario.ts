export class Usuario {
  constructor(
    public id: string,
    public nome: string,
    public email: string,
    public senhaHash: string,
    public senhaSalt: string,
    public ocupacao: string | null,
    public dataCadastro: string
  ) {}
}
