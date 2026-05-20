# Massa de teste: diagnostico

Esta massa atende ao caso de uso atual do sistema: analise de imagem para diagnostico do estagio de vida.

## Arquivo

- `database/migrations/d1/0001_create_diagnosticos.sql`
- `database/seeds/d1/diagnostico-test-data.sql`

## O que o script prepara

- A migration cria a tabela `diagnosticos`, caso ela ainda nao exista no D1 local.
- A migration cria indices basicos para consultas por `life_stage`, `status` e `source`.
- Remove somente registros com `source = 'test_seed_diagnostico'`.
- Insere cenarios de teste para `ovo`, `juvenil`, `adulto` e falha de identificacao.
- Retorna um `SELECT` final para conferencia rapida.

## Como executar localmente

```bash
npm run db:migrate:local
npm run db:seed:diagnostico:test
```

O comando usa o banco D1 local configurado em `wrangler.json`.
