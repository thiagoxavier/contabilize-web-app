## 1. Implementar Cliente de API para Passos e Mensagens

- [ ] 1.1 Criar o arquivo `src/utils/passosApi.js` importando `apiRequest` de `./api`.
- [ ] 1.2 Implementar funções cliente para os endpoints de Passos: Listar por Etapa (`GET /passos/etapa/{etapaId}`), Obter por ID (`GET /passos/{id}`), Criar (`POST /passos`), Atualizar (`PUT /passos/{id}`) e Deletar (`DELETE /passos/{id}`).
- [ ] 1.3 Implementar funções cliente para os endpoints de Mensagens: Listar por Passo (`GET /mensagens-passo/{passoId}`), Criar (`POST /mensagens-passo`), Atualizar (`PUT /mensagens-passo/{id}`) e Deletar (`DELETE /mensagens-passo/{id}`).

## 2. Implementar Gerenciamento de Estado e Contexto

- [ ] 2.1 Criar o arquivo `src/contexts/PassosContext.jsx` contendo `PassosContext`, `PassosProvider` e a exportação do hook `usePassos()`.
- [ ] 2.2 Implementar o estado local (`passos` e `mensagens`) e as ações do provedor para carregar, criar, atualizar e remover passos integrando com `passosApi`.
- [ ] 2.3 Implementar as ações do provedor para carregar, criar, editar e remover mensagens integrando com `passosApi`.
- [ ] 2.4 Modificar o arquivo `src/App.jsx` para envolver a aplicação com o `<PassosProvider>` logo abaixo do `<AuthProvider>` (ou no escopo adequado onde o token de autenticação e os dados de usuário já estejam disponíveis).
