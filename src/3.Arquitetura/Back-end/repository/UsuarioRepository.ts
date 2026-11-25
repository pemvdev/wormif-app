import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { usuarios } from '../db/schema';
import { Usuario } from '../model/Usuario';
import type { IntuitoUsoAplicacao } from '../dto/AuthDTO';

export class UsuarioRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = drizzle(database);
  }

  async criar(usuario: Usuario): Promise<Usuario> {
    await this.db.insert(usuarios).values({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email.toLowerCase(),
      senhaHash: usuario.senhaHash,
      senhaSalt: usuario.senhaSalt,
      ocupacao: usuario.profissao,
      fotoPerfilUrl: usuario.fotoPerfilUrl,
      linkedin: usuario.linkedin,
      intuitoUso: usuario.intuitoUso,
      permiteAnalisePorTerceiros: usuario.permiteAnalisePorTerceiros ? 1 : 0,
      dataCadastro: usuario.dataCadastro,
    });
    return usuario;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const row = await this.db.select().from(usuarios).where(eq(usuarios.email, email.toLowerCase())).get();
    return row ? this.mapRow(row) : null;
  }

  async atualizarPerfil(usuario: Usuario): Promise<boolean> {
    const result = await this.db.run(sql`
      UPDATE usuarios SET nome = ${usuario.nome}, email = ${usuario.email}, ocupacao = ${usuario.profissao},
        foto_perfil_url = ${usuario.fotoPerfilUrl}, linkedin = ${usuario.linkedin},
        intuito_uso = ${usuario.intuitoUso}, permite_analise_por_terceiros = ${usuario.permiteAnalisePorTerceiros ? 1 : 0}
      WHERE id = ${usuario.id} AND NOT EXISTS (
        SELECT 1 FROM usuarios WHERE email = ${usuario.email} AND id <> ${usuario.id}
      )
    `);
    return (result.meta?.changes ?? 0) > 0;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const row = await this.db.select().from(usuarios).where(eq(usuarios.id, id)).get();
    return row ? this.mapRow(row) : null;
  }

  async atualizarCredenciais(id: string, senhaHash: string): Promise<void> {
    await this.db.update(usuarios).set({ senhaHash }).where(eq(usuarios.id, id)).run();
  }

  private mapRow(row: typeof usuarios.$inferSelect): Usuario {
    return new Usuario(
      row.id,
      row.nome,
      row.email,
      row.senhaHash,
      row.senhaSalt,
      row.ocupacao,
      row.fotoPerfilUrl,
      row.linkedin,
      row.intuitoUso as IntuitoUsoAplicacao | null,
      row.permiteAnalisePorTerceiros === 1,
      row.dataCadastro,
    );
  }
}
