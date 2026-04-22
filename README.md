# Wormif — Identificador de Estágios de Vida

Aplicação web (React + Vite) com API em [Hono](https://hono.dev/) sobre [Cloudflare Workers](https://workers.cloudflare.com/), que usa o Google Gemini para analisar imagens de espécimes e estimar espécie e estágio de vida (ovo, larva, ninfa, pupa, juvenil, adulto, etc.).

Este repositório **não** depende de templates ou serviços externos do GetMocha; o build usa apenas `@cloudflare/vite-plugin`, React e a stack listada no `package.json`.

## Requisitos

- Node.js 20+ (recomendado LTS)
- npm
- Conta Google AI Studio ou credencial com acesso à API Gemini (para a chave usada em desenvolvimento e deploy)

## Instalação e execução local

```bash
npm install
```

### Segredo da API (obrigatório para diagnóstico com IA)

O worker lê `GEMINI_API_KEY` a partir dos bindings do Cloudflare. Em desenvolvimento local, o Wrangler carrega variáveis do ficheiro **`.dev.vars`** na raiz do projeto (este ficheiro está no `.gitignore` e não deve ser commitado).

1. Copie o modelo e preencha a chave (o ficheiro `.dev.vars` não deve ir para o Git):

   ```bash
   copy .dev.vars.example .dev.vars
   ```

   Edite `.dev.vars` e defina `GEMINI_API_KEY=sua_chave_aqui` (em macOS/Linux use `cp` em vez de `copy`).

2. Obtenha uma chave em [Google AI Studio](https://aistudio.google.com/apikey) (ou no fluxo de API que a equipa utilizar).

### Servidor de desenvolvimento

```bash
npm run dev
```

O Vite arranca o front-end e integra o worker conforme `vite.config.ts` e `wrangler.json`.

## Scripts npm

| Comando | Descrição |
|--------|-------------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `tsc -b` + build de produção (cliente + worker) |
| `npm run check` | Typecheck, build e `wrangler deploy --dry-run` |
| `npm run lint` | ESLint |
| `npm run knip` | Análise de dependências e ficheiros não usados |
| `npm run cf-typegen` | Gera tipos do Wrangler (`worker-configuration.d.ts`) |

## Estrutura principal

- `src/3.Arquitetura/Front-end` — React, componentes UI, views e cliente HTTP
- `src/3.Arquitetura/Back-end` — Hono, controladores, serviços (IA, armazenamento), DTOs
- `wrangler.json` — nome do worker, `main`, D1, R2 e serviços Cloudflare
- `index.html` — entrada HTML da SPA

A API de diagnóstico expõe rotas sob `/api/diagnostico` (ver `DiagnosticoController.ts`).

## Deploy (Cloudflare)

- Configure segredos no ambiente Cloudflare, por exemplo: `wrangler secret put GEMINI_API_KEY`
- Ajuste `wrangler.json` (nome do worker, IDs de D1/R2, serviços) para o ambiente alvo
- `npm run build` e de seguida o fluxo de deploy da equipa (por exemplo `wrangler deploy`)

## Resolução de problemas

- **Diagnóstico falha ou 500 na API:** confirme que `GEMINI_API_KEY` está definida em `.dev.vars` (local) ou nos secrets do Worker (produção).
- **Erros de tipos do Worker:** execute `npm run cf-typegen` após alterar `wrangler.json` ou bindings.

## Licença e contribuição

Conforme políticas do repositório / organização (WRIF / Ziros).
