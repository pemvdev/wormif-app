import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { tokensRedefinicaoSenha } from '../db/schema';

export class PasswordResetRepository {
  private readonly db;

  constructor(database: D1Database) {
    this.db = drizzle(database);
  }

  async criar(tokenHash: string, usuarioId: string, expiresAt: string): Promise<boolean> {
    const recente = await this.db.select({ createdAt: tokensRedefinicaoSenha.createdAt })
      .from(tokensRedefinicaoSenha).where(eq(tokensRedefinicaoSenha.usuarioId, usuarioId)).get();
    if (recente && Date.parse(recente.createdAt) > Date.now() - 60_000) return false;
    await this.db.delete(tokensRedefinicaoSenha).where(eq(tokensRedefinicaoSenha.usuarioId, usuarioId));
    await this.db.insert(tokensRedefinicaoSenha).values({
      tokenHash, usuarioId, expiresAt, createdAt: new Date().toISOString()
    });
    return true;
  }

  async consumirValido(tokenHash: string): Promise<string | null> {
    const result = await this.db.delete(tokensRedefinicaoSenha).where(
      sql`${tokensRedefinicaoSenha.tokenHash} = ${tokenHash} AND ${tokensRedefinicaoSenha.expiresAt} > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    ).returning({ usuarioId: tokensRedefinicaoSenha.usuarioId }).get();
    return result?.usuarioId ?? null;
  }

  async excluirDoUsuario(usuarioId: string): Promise<void> {
    await this.db.delete(tokensRedefinicaoSenha)
      .where(eq(tokensRedefinicaoSenha.usuarioId, usuarioId)).run();
  }

}
