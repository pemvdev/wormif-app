import { Usuario } from '../model/Usuario';
import type { IntuitoUsoAplicacao } from '../dto/AuthDTO';

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  senha_salt: string;
  ocupacao: string | null;
  foto_perfil_url: string | null;
  linkedin: string | null;
  intuito_uso: IntuitoUsoAplicacao | null;
  permite_analise_por_terceiros: number | null;
  data_cadastro: string;
};

export class UsuarioRepository {
  constructor(private readonly database: D1Database) {}

  async criar(usuario: Usuario): Promise<Usuario> {
    const result = await this.database
      .prepare(
        `
        INSERT INTO usuarios (
          id,
          nome,
          email,
          senha_hash,
          senha_salt,
          ocupacao,
          foto_perfil_url,
          linkedin,
          intuito_uso,
          permite_analise_por_terceiros,
          data_cadastro
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        usuario.id,
        usuario.nome,
        usuario.email.toLowerCase(),
        usuario.senhaHash,
        usuario.senhaSalt,
        usuario.profissao,
        usuario.fotoPerfilUrl,
        usuario.linkedin,
        usuario.intuitoUso,
        usuario.permiteAnalisePorTerceiros ? 1 : 0,
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
        SELECT
          id,
          nome,
          email,
          senha_hash,
          senha_salt,
          ocupacao,
          foto_perfil_url,
          linkedin,
          intuito_uso,
          permite_analise_por_terceiros,
          data_cadastro
        FROM usuarios
        WHERE email = ?
        `
      )
      .bind(email.toLowerCase())
      .first<UsuarioRow>();

    return row ? this.mapRow(row) : null;
  }

  async atualizarPerfil(usuario: Usuario): Promise<boolean> {
    const result = await this.database.prepare(`
      UPDATE usuarios SET nome = ?, email = ?, ocupacao = ?, foto_perfil_url = ?,
        linkedin = ?, intuito_uso = ?, permite_analise_por_terceiros = ?
      WHERE id = ? AND NOT EXISTS (
        SELECT 1 FROM usuarios WHERE email = ? AND id <> ?
      )
    `).bind(
      usuario.nome, usuario.email, usuario.profissao, usuario.fotoPerfilUrl,
      usuario.linkedin, usuario.intuitoUso, usuario.permiteAnalisePorTerceiros ? 1 : 0,
      usuario.id, usuario.email, usuario.id
    ).run();
    if (!result.success) throw new Error('Falha ao atualizar perfil');
    return result.meta.changes > 0;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const row = await this.database
      .prepare(
        `
        SELECT
          id,
          nome,
          email,
          senha_hash,
          senha_salt,
          ocupacao,
          foto_perfil_url,
          linkedin,
          intuito_uso,
          permite_analise_por_terceiros,
          data_cadastro
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
      row.foto_perfil_url,
      row.linkedin,
      row.intuito_uso,
      row.permite_analise_por_terceiros === 1,
      row.data_cadastro
    );
  }
}
