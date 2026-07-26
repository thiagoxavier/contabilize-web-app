## Why

Ao cadastrar uma nova empresa no sistema, a equipe necessita definir manualmente ou opcionalmente a Data de Início do processo e a Data de Fim (previsão/conclusão). Atualmente o formulário só solicita Nome e Pipeline.

## What Changes

- Adição dos campos `Data de Início` e `Data de Fim` no modal de criação de empresa (`ModalNovaEmpresa`).
- Envio das datas no DTO de criação para a API (`empresasApi.criarEmpresa`).

## Capabilities

### New Capabilities
- `empresa-creation-dates`: Permite capturar e salvar a data de início e término no momento do cadastro de uma nova empresa.

### Modified Capabilities

## Impact

- `src/components/abertura-empresa.jsx` (`ModalNovaEmpresa` e `handleCreateEmpresa`).
