type SessaoRow = {
  token: string;
  usuario_id: string;
  expires_at: string;
};

export class SessaoRepository {
  constructor(private readonly database: D1Database) {}

  async criar(token: string, usuarioId: string, expiresAt: string): Promise<void> {
    const result = await this.database
      .prepare('INSERT INTO sessoes (token, usuario_id, expires_at) VALUES (?, ?, ?)')
      .bind(token, usuarioId, expiresAt)
      .run();

    if (!result.success) {
      throw new Error('Falha ao criar sessão');
    }
  }

  async buscarPorToken(token: string): Promise<SessaoRow | null> {
    return this.database
      .prepare('SELECT token, usuario_id, expires_at FROM sessoes WHERE token = ?')
      .bind(token)
      .first<SessaoRow>();
  }

  async excluir(token: string): Promise<void> {
    await this.database.prepare('DELETE FROM sessoes WHERE token = ?').bind(token).run();
  }

  async excluirExpiradas(): Promise<void> {
    await this.database
      .prepare("DELETE FROM sessoes WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
      .run();
  }
}
