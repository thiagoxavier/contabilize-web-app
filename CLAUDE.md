# CLAUDE.md — Portal do Cliente (frontend)

Guia canônico do frontend do **Contabilize Seguro** para a IA. Leia também o [`CLAUDE.md` da raiz](../CLAUDE.md) (mapa full-stack + glossário) e o [`CONVENTIONS.md`](CONVENTIONS.md) (regras de refino). Detalhes de uso final em [`README.md`](README.md).

## O que é

SPA (Single Page Application) que é o **Portal do Cliente**: login corporativo com MFA, gestão segura de credenciais de seguradoras parceiras, gestão de empresas e seu fluxo de trabalho, e administração de usuários — em conformidade com LGPD/SUSEP. White-label (co-branding por tenant).

## Stack real

- **React 19** (Hooks, Context, Refs) + **Vite 8** (ESM, build rápido). **JS puro** — não há TypeScript.
- **CSS vanilla** com **CSS Custom Properties** para temas dinâmicos (`--brand-primary`, `--brand-primary-deep`, `--brand-bg-panel`, `--gold`, …). Arquivos: `src/styles.css`, `src/App.css`, `src/index.css`.
- **Fetch API** encapsulada em `src/utils/api.js` (+ `empresasApi.js`, `pipelinesApi.js`, `passosApi.js`, `empresasApi.js`).
- Deploy: Dockerfile multi-stage + **Nginx Alpine** (fallback SPA, gzip, cache, headers de segurança) — ver `nginx.conf`, `Dockerfile`.
- Lint: ESLint (`eslint.config.js`) com `eslint-plugin-react-hooks` e `react-refresh`.

## Estrutura

```
src/
├─ main.jsx              → entry point
├─ App.jsx              → root; estado global (sessão, telas/permissões, aba ativa)
├─ components/          → login, senhas, clientes, sidebar, abertura-empresa,
│                          EmpresaDetalheDrawer, ModalGerenciarPipelines,
│                          PipelineDatasPanel, PipelineTimelineChat, icons
├─ contexts/            → PassosContext.jsx
├─ utils/               → api.js (base) + *Api.js por domínio
├─ data/                → dados/mocks estáticos
└─ assets/
```

## Padrões obrigatórios

### Comunicação com a API
- **Todo acesso HTTP passa por `utils/api.js` (`apiRequest`) ou pelos `utils/*Api.js`** — nunca `fetch` solto em componente.
- `apiRequest` injeta `Authorization: Bearer <token>` automaticamente (`localStorage['auth_token']`, fallback `sessionStorage['temp_token']`).
- **401 → logout automático** (limpa tokens + `window.location.reload()`). Não trate 401 como erro de negócio.
- Erro exibido ao usuário vem de `errorData.erro || errorData.mensagem` — o backend usa a chave `mensagem`.
- Base da API e detalhes do contrato: [`../docs/contexto/CONTRATO-API.md`](../docs/contexto/CONTRATO-API.md).

### Autenticação e RBAC
- Sessão persiste em `localStorage['auth_token']`; claims do JWT decodificadas por `decodeJwt` para restaurar o usuário.
- Fluxo MFA: token temporário em `sessionStorage['temp_token']` até verificar o código.
- **RBAC por tela:** após login, consultar `/ControleAcesso/usuarios/{userId}/telas-acessiveis`; os códigos (`geren_seguros`, `geren_usuarios`, …) controlam visibilidade de abas/menu na `Sidebar`. É **UI apenas** — a autorização real é no backend.

### Estilo / tema
- Use as **CSS Custom Properties** existentes; não hardcode cores. Tema/branding vem do tenant.
- Textos de usuário em **pt-BR**.

## Comandos

```bash
npm install
npm run dev        # Vite em http://localhost:5173
npm run lint
npm run build
npm run preview
```

Docker (produção): `docker build -t contabilize-web-app:latest .` → `docker run -d -p 80:80 ...`.

## Segurança / LGPD

- Credenciais de seguradora são dados sensíveis: só exibir no fluxo autorizado; nunca logar no console; nunca persistir fora do que o backend retorna sob demanda.
- Nunca colocar token/credencial em query string ou em log.
