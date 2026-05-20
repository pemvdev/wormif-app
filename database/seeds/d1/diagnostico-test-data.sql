-- Test data for the image diagnosis use case.
-- Target: Cloudflare D1 local database configured in wrangler.json.

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

BEGIN TRANSACTION;

DELETE FROM diagnosticos
WHERE source = 'test_seed_diagnostico';

INSERT INTO diagnosticos (
  diagnostic_date,
  status,
  confidence_level,
  life_stage,
  validated_by_specialist,
  species,
  common_name,
  description,
  characteristics_json,
  habitat,
  source
) VALUES
(
  '2026-05-20T09:00:00.000Z',
  'concluido',
  0.94,
  'ovo',
  1,
  'Eisenia fetida',
  'Minhoca-vermelha-da-california',
  'Imagem de teste com casulos ovais compativeis com a fase de ovo.',
  json_array('casulo oval', 'cor amarelada', 'ausencia de segmentos visiveis'),
  'Composteira umida com materia organica em decomposicao',
  'test_seed_diagnostico'
),
(
  '2026-05-20T09:05:00.000Z',
  'concluido',
  0.89,
  'juvenil',
  0,
  'Eisenia fetida',
  'Minhoca-vermelha-da-california',
  'Imagem de teste com individuo jovem, fino e sem clitelo aparente.',
  json_array('corpo fino', 'segmentacao evidente', 'clitelo ausente'),
  'Substrato rico em residuos vegetais',
  'test_seed_diagnostico'
),
(
  '2026-05-20T09:10:00.000Z',
  'concluido',
  0.97,
  'adulto',
  1,
  'Eisenia fetida',
  'Minhoca-vermelha-da-california',
  'Imagem de teste com individuo adulto e clitelo bem definido.',
  json_array('clitelo visivel', 'cor avermelhada', 'maior espessura corporal'),
  'Canteiro de compostagem estabilizado',
  'test_seed_diagnostico'
),
(
  '2026-05-20T09:15:00.000Z',
  'erro',
  0,
  'desconhecido',
  0,
  'Unknown',
  'Nao identificado',
  'Imagem de teste invalida ou sem nitidez suficiente para diagnostico.',
  json_array('imagem desfocada', 'baixo contraste', 'organismo nao confirmado'),
  'Nao identificado',
  'test_seed_diagnostico'
);

COMMIT;

SELECT
  id,
  diagnostic_date,
  status,
  confidence_level,
  life_stage,
  validated_by_specialist,
  species,
  common_name,
  source
FROM diagnosticos
WHERE source = 'test_seed_diagnostico'
ORDER BY diagnostic_date;
