## Context

Ao criar uma nova empresa, a UI exibe o modal `ModalNovaEmpresa`. O backend já suporta o recebimento dos campos `dataInicio` e `dataFim` no payload do POST `/empresas`.

## Goals / Non-Goals

**Goals:**
- Adicionar campos visuais de Data de Início e Data de Fim no modal de cadastro.
- Transmitir esses valores formatados em ISO no objeto enviado a `empresasApi.criarEmpresa`.

**Non-Goals:**
- Validação avançada de datas no frontend além da ordenação básica (data inicio <= data fim).

## Decisions

- Utilizar `<input type="date">` nativo do HTML para manter consistência e simplicidade na UI.
- Passar os valores como `dataInicio || null` e `dataFim || null`.

## Risks / Trade-offs

- [Risk] O usuário inserir data fim anterior à data início.
- Mitigation: Validar se `dataFim` < `dataInicio` no momento do submit no frontend.
