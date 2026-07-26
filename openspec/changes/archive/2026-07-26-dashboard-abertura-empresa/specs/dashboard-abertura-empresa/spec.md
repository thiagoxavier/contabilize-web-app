## ADDED Requirements

### Requirement: Acesso à tela de Abertura de empresa via RBAC

O sistema SHALL expor uma nova aba "Abertura de empresa" no portal, dentro do shell existente (`Sidebar` + `Topbar`), cuja visibilidade é controlada pelo código de tela retornado por `/ControleAcesso/usuarios/{userId}/telas-acessiveis`.

#### Scenario: Usuário com permissão vê a aba

- **WHEN** o usuário autenticado possui o código de tela `abertura_empresa` entre as telas acessíveis
- **THEN** o item "Abertura de empresa" aparece na `Sidebar` e a tela pode ser ativada

#### Scenario: Usuário sem permissão não vê a aba

- **WHEN** o usuário autenticado não possui o código de tela `abertura_empresa`
- **THEN** o item de navegação não é renderizado e a tela não é acessível

### Requirement: Board Kanban por pipeline

O sistema SHALL exibir um board Kanban horizontalmente rolável em que cada **coluna** representa uma **etapa** do processo e cada **card** representa uma **empresa** posicionada na sua etapa atual.

#### Scenario: Renderização das colunas e cards

- **WHEN** a tela de Abertura de empresa é aberta com o pipeline ativo
- **THEN** cada etapa do pipeline é renderizada como uma coluna com seu título
- **AND** cada empresa aparece como card na coluna correspondente à sua etapa atual

#### Scenario: Contagem por coluna

- **WHEN** uma coluna é renderizada
- **THEN** um badge exibe a quantidade de empresas naquela etapa

#### Scenario: Coluna vazia

- **WHEN** uma etapa não possui empresas
- **THEN** a coluna exibe a mensagem "Nenhum cliente nesta etapa"

### Requirement: Abas de pipeline

O sistema SHALL permitir alternar entre os pipelines `Abertura de empresa` e `Cliente com empresa (transferência)`, cada um com seu próprio conjunto de etapas e empresas.

#### Scenario: Trocar de pipeline

- **WHEN** o usuário seleciona a aba de outro pipeline
- **THEN** o board passa a exibir as etapas e empresas daquele pipeline
- **AND** qualquer modal aberto é fechado

### Requirement: Card de empresa

O sistema SHALL exibir, em cada card de empresa, o nome da empresa, uma tag de status, o avatar do responsável e uma barra de progresso da etapa atual.

#### Scenario: Status derivado do progresso

- **WHEN** nenhum item do checklist da etapa está concluído
- **THEN** a tag exibe "Não iniciado" e o progresso é 0%
- **WHEN** todos os itens estão concluídos
- **THEN** a tag exibe "Concluído" e o progresso é 100%
- **WHEN** parte dos itens está concluída
- **THEN** a tag exibe "Em andamento" e o progresso é o percentual de itens concluídos

#### Scenario: Abrir detalhes da etapa

- **WHEN** o usuário clica em um card de empresa
- **THEN** o `ModalEtapaDetalhes` abre com os dados da empresa e da etapa atual

### Requirement: Modal de detalhes da etapa

O sistema SHALL exibir um modal com o responsável, a barra de progresso da etapa, o checklist de itens da etapa e um rodapé de navegação entre etapas.

#### Scenario: Marcar e desmarcar item do checklist

- **WHEN** o usuário alterna um item do checklist
- **THEN** o estado do item é atualizado e a barra de progresso e a tag de status recalculam

#### Scenario: Concluir e avançar habilitado apenas com checklist completo

- **WHEN** nem todos os itens da etapa estão concluídos
- **THEN** o botão "Concluir e avançar" fica desabilitado
- **WHEN** todos os itens estão concluídos e a etapa não é a última
- **THEN** o botão "Concluir e avançar" fica habilitado e, ao acionar, move a empresa para a próxima etapa

#### Scenario: Navegar para etapa anterior

- **WHEN** a etapa atual não é a primeira
- **THEN** o botão "Etapa anterior" é exibido e, ao acionar, move a empresa para a etapa anterior

#### Scenario: Fechar o modal

- **WHEN** o usuário pressiona Escape, clica no overlay ou no botão de fechar
- **THEN** o modal é fechado sem alterar a etapa da empresa

### Requirement: Diretriz de UI (design system do projeto)

O sistema SHALL reutilizar o layout do protótipo aplicando exclusivamente o design system do projeto (`src/styles.css`), sem introduzir novos tokens de cor ou fonte.

#### Scenario: Tokens do projeto aplicados

- **WHEN** a tela e o modal são renderizados
- **THEN** a tipografia usa `Be Vietnam Pro` e a cor primária usa `--gold`/`--gold-deep`
- **AND** superfícies, bordas, raios e sombras usam os tokens existentes (`--paper`, `--rule`, `--r-*`, `--shadow-*`)
- **AND** nenhum token de cor/fonte do protótipo (azul `--blue-*`, `Roboto`) é introduzido
