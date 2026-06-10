import { Usuario } from '../model/Usuario';

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  senha_salt: string;
  ocupacao: string | null;
  data_cadastro: string;
};

export class UsuarioRepository {
  constructor(private readonly database: D1Database) {}

  async criar(usuario: Usuario): Promise<Usuario> {
    const result = await this.database
      .prepare(
        `
        INSERT INTO usuarios (id, nome, email, senha_hash, senha_salt, ocupacao, data_cadastro)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        usuario.id,
        usuario.nome,
        usuario.email.toLowerCase(),
        usuario.senhaHash,
        usuario.senhaSalt,
        usuario.ocupacao,
        usuario.dataCadastro
      )
      .run();

    if (!result.success) {
      throw new Error('Falha ao criar usuário');
    }

    return usuario;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const row = await this.database
      .prepare(
        `
        SELECT id, nome, email, senha_hash, senha_salt, ocupacao, data_cadastro
        FROM usuarios
        WHERE email = ?
        `
      )
      .bind(email.toLowerCase())
      .first<UsuarioRow>();

    return row ? this.mapRow(row) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const row = await this.database
      .prepare(
        `
        SELECT id, nome, email, senha_hash, senha_salt, ocupacao, data_cadastro
        FROM usuarios
        WHERE id = ?
        `
      )
      .bind(id)
      .first<UsuarioRow>();

    return row ? this.mapRow(row) : null;
  }

  private mapRow(row: UsuarioRow): Usuario {
    return new Usuario(
      row.id,
      row.nome,
      row.email,
      row.senha_hash,
      row.senha_salt,
      row.ocupacao,
      row.data_cadastro
    );
  }
}
