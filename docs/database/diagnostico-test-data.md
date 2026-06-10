# Massa de teste: diagnostico e usuario

Esta massa atende aos casos de uso de autenticacao, manter diagnostico e consultar historico.

## Arquivos

- `database/migrations/d1/0001_create_diagnosticos.sql`
- `database/migrations/d1/0002_create_usuarios_and_user_id.sql`
- `database/seeds/d1/usuario-test-data.sql`
- `database/seeds/d1/diagnostico-test-data.sql`

## O que o script prepara

- Tabela `usuarios` com credenciais de teste.
- Tabela `sessoes` para tokens de login.
- Coluna `user_id` em `diagnosticos` (cada registro pertence a um usuario).
- Diagnostico de seed vinculado ao usuario `test-user-wormif-001`.

## Usuario de teste

| Campo | Valor |
|-------|-------|
| E-mail | `teste@wormif.app` |
| Senha | `senha123` |
| ID | `test-user-wormif-001` |

## Como executar localmente

```bash
npm run db:setup:local
```

Ou passo a passo:

```bash
npm run db:migrate:local
npm run db:seed:usuario:test
npm run db:seed:diagnostico:test
```

O comando usa o banco D1 local configurado em `wrangler.json`.
