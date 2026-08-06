# Convenções de refino — Portal do Cliente (frontend)

Regras acionáveis para **revisar/refatorar** o front sem mudar contrato. Descrição do sistema em [`CLAUDE.md`](CLAUDE.md). Prefixos: **`[OBRIGATÓRIO]`**, **`[PADRÃO]`**, **`[SUGERIDO]`**.

## 1. Componentes e estado
- **[OBRIGATÓRIO]** Componentes funcionais + Hooks. Sem class components.
- **[OBRIGATÓRIO]** Respeitar as regras dos Hooks (o lint `eslint-plugin-react-hooks` deve passar limpo).
- **[PADRÃO]** Estado global de sessão/telas/aba fica em `App.jsx`; estado de domínio compartilhado em Context (`PassosContext`). Não crie biblioteca de estado nova (Redux/Zustand) sem justificativa.
- **[PADRÃO]** Um componente por arquivo em `src/components/`; nome do arquivo reflete o componente.
- **[SUGERIDO]** Extraia lógica repetida para hook (`useXxx`) ou util antes de duplicar.

## 2. Comunicação com a API
- **[OBRIGATÓRIO]** Nada de `fetch` solto — use `utils/api.js` (`apiRequest`) ou um `utils/*Api.js`. Se faltar um wrapper para o domínio, crie em `utils/`.
- **[OBRIGATÓRIO]** Não reimplementar injeção de token nem tratamento de 401 — já estão no `apiRequest`.
- **[OBRIGATÓRIO]** Mensagem de erro ao usuário vem do backend (`erro`/`mensagem`); não invente texto que mascare a causa.
- **[PADRÃO]** Chamadas de rede dentro de `useEffect`/handlers, com estado de loading/erro tratado na UI.

## 3. Estilo e tema
- **[OBRIGATÓRIO]** Usar as CSS Custom Properties (`--brand-*`, `--gold`, …) — **não** hardcodar cores/tamanhos de marca.
- **[PADRÃO]** Manter o CSS nos arquivos existentes (`styles.css`, `App.css`, `index.css`); evitar CSS-in-JS.
- **[SUGERIDO]** Classes semânticas e reutilizáveis; evitar estilos inline exceto valores dinâmicos.

## 4. Acessibilidade e UX
- **[PADRÃO]** Elementos interativos acessíveis (`button` real, `label`/`aria-*`, foco visível). Inputs de OTP e formulários com feedback claro.
- **[SUGERIDO]** Estados de loading, vazio e erro sempre visíveis ao usuário.

## 5. Idioma e LGPD
- **[OBRIGATÓRIO]** Textos de usuário em **pt-BR**.
- **[OBRIGATÓRIO]** Credenciais de seguradora: exibir só no fluxo autorizado; **nunca** `console.log` de credencial/token; nunca em query string.
- **[PADRÃO]** RBAC por tela é só UI — nunca tratar a lista de telas como controle de segurança efetivo.

## 6. Qualidade
- **[OBRIGATÓRIO]** `npm run lint` passa sem erros antes de concluir.
- **[PADRÃO]** `npm run build` continua funcionando após a mudança.
- **[SUGERIDO]** Remover código morto, imports e mocks (`src/data/`) não usados ao refatorar.

## Checklist de refino de componente
- [ ] Hooks corretos, lint limpo.
- [ ] Rede via `utils/*Api.js`, sem duplicar auth/401.
- [ ] Cores/tema via CSS variables.
- [ ] Loading/erro/vazio tratados.
- [ ] pt-BR e sem vazamento de dado sensível.
- [ ] `npm run lint` e `npm run build` ok.
