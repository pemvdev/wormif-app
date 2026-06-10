-- Test user for local development and E2E.
-- Email: teste@wormif.app | Password: senha123

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, senha_salt, ocupacao, data_cadastro)
VALUES (
  'test-user-wormif-001',
  'teste',
  'teste@wormif.app',
  'a9c37f829b72d4744a0ddc31d1734978e85361e8413d207c98f1bda63ec2554b',
  'wormif-test-salt',
  'tecnico',
  '2026-01-01T00:00:00.000Z'
);

SELECT id, nome, email FROM usuarios WHERE id = 'test-user-wormif-001';
