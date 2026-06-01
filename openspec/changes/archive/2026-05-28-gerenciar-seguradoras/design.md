## Context

O backend em C# (Web API) e as tabelas do PostgreSQL já foram desenvolvidos pelo usuário. O foco deste design é estritamente no frontend (React/JSX), garantindo que a comunicação com a API em `https://localhost:7027/api` esteja totalmente integrada, que os componentes lidem adequadamente com o carregamento dinâmico e que a contagem de seguradoras na sidebar reflita os dados reais.

## Goals / Non-Goals

**Goals:**
- Conectar as chamadas de API existentes em `src/components/senhas.jsx` aos endpoints reais do backend.
- Sincronizar o contador de senhas da sidebar em `src/App.jsx` com a quantidade de itens reais retornados da API.
- Garantir tratabilidade de erros amigável no frontend caso a API falhe (ex: token expirado, erro de conexão, etc.).
- Refinar os fluxos de criação e edição no formulário do modal para garantir a consistência dos dados trafegados.

**Non-Goals:**
- Implementar tabelas de banco de dados, migrações de dados ou endpoints C#.
- Desenvolver novas interfaces de administração que não façam parte da especificação do cofre de senhas de seguradoras.

## Decisions

### 1. Estado Compartilhado de Contagem de Senhas
- **Escolha**: Elevar o estado de contagem de seguradoras ou prover um callback de atualização em `App.jsx` que recebe a contagem após a carga da API realizada em `SenhasPage`.
- **Racional**: A sidebar precisa exibir o número correto de credenciais. Como os dados são buscados na montagem do `SenhasPage`, enviar essa contagem via callback para o pai `App` permite atualizar dinamicamente o contador sem precisar de ferramentas complexas de estado global (Zustand, Redux).
- **Alternativas**: Fazer uma requisição separada da API de dentro do `App.jsx` (rejeitado por duplicar chamadas de API); Usar context API (rejeitado por ser desnecessário para um único contador simples).

### 2. Validação Frontend de Senhas
- **Escolha**: Manter a lógica de cálculo de força da senha em `scorePwd` no frontend alinhada com as regras de validação do backend (caracteres especiais, comprimento mínimo de 8 caracteres, etc.).
- **Racional**: Proporciona feedback instantâneo ao usuário enquanto ele digita no modal antes de submeter o formulário para a API.

## Risks / Trade-offs

- `[Divergência de Contagem Estática vs Dinâmica]` → A sidebar anteriormente usava `SEGURADORAS.length` de um mock estático. Se não atualizado dinamicamente, o número de senhas na barra lateral ficaria desatualizado ou inconsistente com os dados reais salvos no PostgreSQL.
  - *Mitigação*: Implementar callback `onCountChange` em `SenhasPage` para alimentar o estado em `App.jsx`.
