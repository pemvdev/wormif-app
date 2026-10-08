PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS diagnostico_discussao (
  sequencia INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  diagnostico_id INTEGER NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES diagnostico_discussao(id) ON DELETE CASCADE,
  especie TEXT,
  estagio TEXT CHECK (estagio IS NULL OR estagio IN ('ovo', 'larva', 'ninfa', 'pupa', 'juvenil', 'subadulto', 'adulto', 'desconhecido')),
  comentario TEXT NOT NULL DEFAULT '',
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  CHECK ((parent_id IS NULL AND especie IS NOT NULL AND estagio IS NOT NULL)
    OR (parent_id IS NOT NULL AND especie IS NULL AND estagio IS NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discussao_palpite_principal
  ON diagnostico_discussao(diagnostico_id, usuario_id) WHERE parent_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_discussao_sequencia ON diagnostico_discussao(diagnostico_id, sequencia);
CREATE INDEX IF NOT EXISTS idx_discussao_parent ON diagnostico_discussao(parent_id);

-- Preserve existing hypotheses and their IDs, keeping the legacy table as a migration source.
INSERT OR IGNORE INTO diagnostico_discussao (
  id, diagnostico_id, usuario_id, parent_id, especie, estagio, comentario, criado_em, atualizado_em
)
SELECT id, diagnostico_id, usuario_id, NULL, especie, estagio, comentario, atualizado_em, atualizado_em
FROM diagnostico_palpites ORDER BY atualizado_em, id;
