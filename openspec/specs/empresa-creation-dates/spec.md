## ADDED Requirements

### Requirement: Modal de criação de empresa aceita datas de início e fim
O componente de formulário de nova empresa MUST disponibilizar os campos de data de início do processo e data de término para preenchimento do usuário.

#### Scenario: Preenchimento das datas de início e fim no cadastro
- **WHEN** o usuário seleciona as datas de início e fim no modal de criação e confirma o envio
- **THEN** o sistema envia o payload contendo `nome`, `pipelineId`, `dataInicio` e `dataFim` para a API.
