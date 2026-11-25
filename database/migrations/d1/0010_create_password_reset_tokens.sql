CREATE TABLE IF NOT EXISTS tokens_redefinicao_senha (
  token_hash TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_redefinicao_usuario
  ON tokens_redefinicao_senha(usuario_id);

CREATE INDEX IF NOT EXISTS idx_tokens_redefinicao_expiracao
  ON tokens_redefinicao_senha(expires_at);
