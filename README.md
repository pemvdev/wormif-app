# Wormif — Identificador de Estágios de Vida

Monorepo Vite + React (cliente) e Hono no Cloudflare Worker (API). O modelo por omissão está em `src/3.Arquitetura/Back-end/config/AIConfig.ts`.

## Requisitos

- Node.js 20+
- npm
- `OPENAI_API_KEY` com acesso ao modelo configurado no projeto

## Instalação

```bash
npm install
```

### Variáveis locais

Crie `.dev.vars` na raiz (não versionado):

```
OPENAI_API_KEY=...
```

Pode partir de `.dev.vars.example`. A chave deve corresponder ao fornecedor configurado no código.

### Desenvolvimento

```bash
npm run dev
```

## Scripts

| Comando | Descrição |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + build |
| `npm run check` | Typecheck, build, `wrangler deploy --dry-run` |
| `npm run db:migrate:local` | Cria/atualiza localmente a estrutura D1 do diagnóstico |
| `npm run db:seed:diagnostico:test` | Executa a massa SQL local do caso de uso de diagnóstico no D1 |
| `npm run lint` | ESLint |
| `npm run knip` | Knip |
| `npm run cf-typegen` | Tipos Wrangler |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright UI |
| `npm run test:e2e:report` | Relatório HTML |

## Telas (10 requisitos funcionais)

| # | Requisito | Rota |
|---|-----------|------|
| 1 | Cadastro | `/cadastro` |
| 2 | Login | `/login` |
| 3 | Upload de imagens | `/upload` |
| 4 | Identificação por IA | `/identificacao` |
| 5 | Exibição dos resultados | `/resultado` |
| 6 | Histórico | `/historico` |
| 7 | Perfil | `/perfil` |
| 8 | Configurações | `/configuracoes` |
| 9 | Geolocalização | `/geolocalizacao` |
| 10 | Planos | `/planos` |

Fluxo de análise: **Upload → Identificação IA → Resultado** (stepper no topo).

## Testes automatizados (Playwright)

| Ficheiro | Plano de testes |
|----------|-----------------|
| `src/4.Teste/e2e/manter-diagnostico.spec.ts` | **Manter Diagnóstico** (UI, 7 cenários) |
| `src/4.Teste/e2e/processar-diagnostico.spec.ts` | **Processar Diagnóstico** (API, 3 cenários) |

Configuração Playwright: `src/4.Teste/playwright.config.ts`. Fixtures em `src/4.Teste/e2e/fixtures/`.

```bash
npm install
npx playwright install chromium   # primeira vez
npm run test:e2e
```

O `src/4.Teste/playwright.config.ts` sobe o `npm run dev` automaticamente (raiz do projeto).

- **Manter Diagnóstico:** cenário 5 percorre upload → identificação (mock API) → resultado; cenário 7 exclui no histórico.
- **Processar Diagnóstico:** API em `/api/diagnostico/analisar`.

## Estrutura

- `src/3.Arquitetura/Front-end` — UI
- `src/3.Arquitetura/Back-end` — API Hono, serviços, DTOs
- `wrangler.json` — Worker, assets, D1, R2

Rotas de diagnóstico: `/api/diagnostico` (ver `DiagnosticoController.ts`).

## Deploy

- `wrangler secret put OPENAI_API_KEY`
- Ajustar `wrangler.json` ao ambiente
- `npm run build` e `wrangler deploy` (ou pipeline da equipa)

## Resolução de problemas

- Falhas na rota de análise: verificar `OPENAI_API_KEY` em `.dev.vars` ou secrets do Worker.
- Tipos do Worker: `npm run cf-typegen` após alterar bindings.

## Licença

Conforme política do repositório / WRIF / Ziros.
