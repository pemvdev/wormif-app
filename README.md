# Wormif — Identificador de Estágios de Vida

Monorepo Vite + React (cliente) e Hono no Cloudflare Worker (API). A análise de imagens usa um endpoint comercial multimodal; o modelo por omissão está em `src/3.Arquitetura/Back-end/config/AIConfig.ts`.

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

Pode partir de `.dev.vars.example`. Chaves: [documentação do fornecedor](https://platform.openai.com/api-keys).

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
| `npm run lint` | ESLint |
| `npm run knip` | Knip |
| `npm run cf-typegen` | Tipos Wrangler |

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
