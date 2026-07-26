# passos-estado-cliente Specification

## Purpose
TBD - created by archiving change passos-estado-cliente. Update Purpose after archive.
## Requirements
### Requirement: Obter Passos da Etapa via API
O sistema React SHALL requisitar a lista de passos associados a uma etapa específica (`etapaId`) a partir do backend.

#### Scenario: Carregamento de passos com sucesso
- **WHEN** a ação `carregarPassos` for disparada com um `etapaId` válido
- **THEN** o sistema SHALL enviar uma requisição HTTP `GET /api/passos/etapa/{etapaId}` e atualizar o mapeamento correspondente no estado global `passos` com os dados recebidos.

### Requirement: Obter Mensagens do Passo via API
O sistema React SHALL requisitar as mensagens de histórico de um passo específico (`passoId`) a partir do backend.

#### Scenario: Carregamento de mensagens com sucesso
- **WHEN** a ação `carregarMensagens` for disparada com um `passoId` válido
- **THEN** o sistema SHALL enviar uma requisição HTTP `GET /api/mensagens-passo/{passoId}` e atualizar o mapeamento correspondente no estado global `mensagens` com a lista de mensagens recebida.

### Requirement: Criar Passo via API
O sistema React SHALL permitir a criação de um novo passo associado a uma etapa específica no backend.

#### Scenario: Criação de passo com sucesso
- **WHEN** a ação `criarPasso` for disparada com `etapaId` e dados válidos
- **THEN** o sistema SHALL enviar uma requisição HTTP `POST /api/passos` contendo os dados do passo e atualizar o estado local inserindo o novo passo na etapa.

### Requirement: Atualizar Passo via API
O sistema React SHALL permitir a atualização de informações (título, descrição, status, responsável) de um passo existente no backend.

#### Scenario: Atualização de passo com sucesso
- **WHEN** a ação `atualizarPasso` for disparada com um `passoId` e dados de atualização válidos
- **THEN** o sistema SHALL enviar uma requisição HTTP `PUT /api/passos/{passoId}` com os novos dados e atualizar o estado local refletindo as modificações no passo correspondente.

### Requirement: Deletar Passo via API
O sistema React SHALL permitir a remoção de um passo existente no backend.

#### Scenario: Deleção de passo com sucesso
- **WHEN** a ação `deletarPasso` for disparada com um `passoId` válido
- **THEN** o sistema SHALL enviar uma requisição HTTP `DELETE /api/passos/{passoId}` e remover o passo do estado local de passos da etapa correspondente.

### Requirement: Criar Mensagem via API
O sistema React SHALL permitir o envio de uma nova mensagem associada a um passo específico no backend.

#### Scenario: Envio de mensagem com sucesso
- **WHEN** a ação `criarMensagem` for disparada com `passoId` e o texto da mensagem
- **THEN** o sistema SHALL enviar uma requisição HTTP `POST /api/mensagens-passo` e atualizar o estado local adicionando a mensagem criada à lista correspondente daquele passo.

### Requirement: Atualizar Mensagem via API
O sistema React SHALL permitir a edição de uma mensagem própria no backend.

#### Scenario: Edição de mensagem com sucesso
- **WHEN** a ação `atualizarMensagem` for disparada com o `mensagemId` e o novo texto por um usuário autorizado (autor)
- **THEN** o sistema SHALL enviar uma requisição HTTP `PUT /api/mensagens-passo/{mensagemId}` e atualizar o texto da mensagem no estado local correspondente.

### Requirement: Deletar Mensagem via API
O sistema React SHALL permitir a remoção (soft-delete) de uma mensagem no backend.

#### Scenario: Deleção de mensagem com sucesso
- **WHEN** a ação `deletarMensagem` for disparada com o `mensagemId` por um usuário administrador
- **THEN** o sistema SHALL enviar uma requisição HTTP `DELETE /api/mensagens-passo/{mensagemId}` e marcar a mensagem como deletada ou removê-la no estado local.

