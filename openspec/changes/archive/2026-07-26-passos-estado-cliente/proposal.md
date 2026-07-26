## Why

Para evoluir o acompanhamento de abertura de empresas para um sistema colaborativo real, a camada de frontend React precisa sair dos dados estáticos locais e integrar-se com as APIs de persistência do backend. Esta mudança implementa a camada de serviços de API e o gerenciamento de estado unificado (Context) para passos e mensagens, servindo de base para a interface de usuário (UI) e polling posteriores.

## What Changes

- **Novo módulo de API** em `src/utils/passosApi.js` encapsulando as chamadas HTTP para os endpoints de Passos e Mensagens no backend (reutilizando a lógica de autenticação JWT e tratamento de erros do `apiRequest` existente).
- **Novo contexto React** em `src/contexts/PassosContext.jsx` (`PassosProvider` e hook `usePassos`) para armazenar o estado global de passos por etapa, mensagens por passo, status de carregamento (`loading`), e expor as ações de CRUD correspondentes.
- **Integração no ponto de entrada** em `src/App.jsx` envolvendo a árvore de componentes com o `PassosProvider` para tornar o estado disponível globalmente.

## Capabilities

### New Capabilities
- `passos-estado-cliente`: Camada de dados, chamadas de API e contexto React global para carregamento e manipulação (CRUD) de passos de etapas e mensagens no fluxo de abertura de empresas, servindo de fundação para os componentes visuais.

### Modified Capabilities
<!-- Nenhuma capability existente tem requisitos alterados. -->

## Impact

- **utils**: Nova API cliente em `src/utils/passosApi.js`.
- **contexts**: Novo contexto `src/contexts/PassosContext.jsx`.
- **App entrypoint**: `src/App.jsx` é modificado para declarar o `PassosProvider` abaixo do login/auth do usuário.
- **Segurança**: Reuso automático do JWT armazenado no `localStorage` via utilitários do sistema.
