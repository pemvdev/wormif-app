-- Creates the persistence table for the image diagnosis use case.
-- Target: Cloudflare D1 database configured in wrangler.json.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS diagnosticos (
  id INTEGER PRIMARY KEY,
  diagnostic_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processando', 'concluido', 'erro')),
  confidence_level REAL NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  life_stage TEXT NOT NULL CHECK (
    life_stage IN (
      'ovo',
      'larva',
      'ninfa',
      'pupa',
      'juvenil',
      'subadulto',
      'adulto',
      'desconhecido'
    )
  ),
  validated_by_specialist INTEGER NOT NULL DEFAULT 0 CHECK (validated_by_specialist IN (0, 1)),
  species TEXT NOT NULL,
  common_name TEXT NOT NULL,
  description TEXT NOT NULL,
  characteristics_json TEXT NOT NULL CHECK (json_valid(characteristics_json)),
  habitat TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'application',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_life_stage
  ON diagnosticos (life_stage);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_status
  ON diagnosticos (status);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_source
  ON diagnosticos (source);
