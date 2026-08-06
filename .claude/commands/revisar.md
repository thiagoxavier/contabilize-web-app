---
name: "Revisar (frontend)"
description: Passe de revisão/refatoração do front guiado por CONVENTIONS.md, sem mudar contrato
category: Refino
tags: [refino, revisao, frontend]
---

Modo **Refinar** do frontend: revisar/refatorar código existente **sem mudar contrato** (feature nova → `/opsx:propose`).

**Input**: caminho(s) de arquivo ou área após `/revisar` (ex.: `src/components/senhas.jsx`). Se vazio, revise as mudanças não commitadas (`git status`/`git diff`).

**Passos**

1. Leia as regras: `CONVENTIONS.md` e `CLAUDE.md`. Prefixos `[OBRIGATÓRIO]`/`[PADRÃO]`/`[SUGERIDO]` = severidade.
2. Leia o(s) alvo(s) e componentes/utils relacionados.
3. Avalie contra o **checklist de refino de componente** (fim do CONVENTIONS):
   - Componentes funcionais + Hooks; lint de hooks limpo.
   - Rede via `utils/api.js`/`utils/*Api.js` — sem `fetch` solto, sem reimplementar auth/401.
   - Cores/tema via CSS Custom Properties, nunca hardcode.
   - Estados de loading/erro/vazio tratados.
   - Textos pt-BR; sem `console.log` de credencial/token; nada sensível em query string.
   - RBAC por tela tratado só como UI.
4. Liste os achados por severidade (OBRIGATÓRIO primeiro), com arquivo:linha e correção proposta.
5. **Só aplique** o que o usuário aprovar. Ao terminar, garanta `npm run lint` e `npm run build` limpos.
6. Se um achado exigir endpoint/DTO inexistente, **não** invente contrato — recomende propor na API e conferir `../docs/contexto/CONTRATO-API.md`.
