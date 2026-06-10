-- Test data for the image diagnosis use case.
-- Requires usuario-test-data.sql (test-user-wormif-001).

PRAGMA foreign_keys = ON;

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
  source,
  user_id
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
  'test_seed_diagnostico',
  'test-user-wormif-001'
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
  'test_seed_diagnostico',
  'test-user-wormif-001'
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
  'test_seed_diagnostico',
  'test-user-wormif-001'
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
  'test_seed_diagnostico',
  'test-user-wormif-001'
);

COMMIT;

SELECT id, species, common_name, user_id, source
FROM diagnosticos
WHERE source = 'test_seed_diagnostico'
ORDER BY diagnostic_date;
