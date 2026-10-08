PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS diagnostico_palpites (
  id TEXT NOT NULL UNIQUE,
  diagnostico_id INTEGER NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  especie TEXT NOT NULL,
  estagio TEXT NOT NULL CHECK (estagio IN ('ovo', 'larva', 'ninfa', 'pupa', 'juvenil', 'subadulto', 'adulto', 'desconhecido')),
  comentario TEXT NOT NULL DEFAULT '',
  atualizado_em TEXT NOT NULL,
  PRIMARY KEY (diagnostico_id, usuario_id)
);
