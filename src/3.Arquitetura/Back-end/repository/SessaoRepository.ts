import { drizzle } from 'drizzle-orm/d1';
import { eq, lt, sql } from 'drizzle-orm';
import { sessoes } from '../db/schema';

export class SessaoRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = drizzle(database);
  }

  async criar(token: string, usuarioId: string, expiresAt: string): Promise<void> {
    await this.db.insert(sessoes).values({ token, usuarioId, expiresAt });
  }

  async buscarPorToken(token: string) {
    const row = await this.db.select().from(sessoes).where(eq(sessoes.token, token)).get();
    return row ? { token: row.token, usuario_id: row.usuarioId, expires_at: row.expiresAt } : null;
  }

  async excluir(token: string): Promise<void> {
    await this.db.delete(sessoes).where(eq(sessoes.token, token));
  }

  async excluirDoUsuario(usuarioId: string): Promise<void> {
    await this.db.delete(sessoes).where(eq(sessoes.usuarioId, usuarioId)).run();
  }

  async excluirExpiradas(): Promise<void> {
    await this.db.delete(sessoes).where(lt(sessoes.expiresAt, sql`strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`));
  }
}
