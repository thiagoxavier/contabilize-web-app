## Why

Atualmente, os administradores não possuem uma interface visual no Web App para visualizar as credenciais e senhas dos clientes em casos de suporte ou necessidade de verificação. Esta alteração resolve essa lacuna ao implementar uma área segura e acessível no painel administrativo para visualizar o cofre de credenciais de um cliente.

## What Changes

- Adição de um botão com ícone de chave (`key`/`lock`) na coluna de ações da tabela de clientes (`ClientesPage`) em `src/components/clientes.jsx`.
- Implementação de um novo componente modal `<CofreClienteModal>` em `src/components/clientes.jsx` para listar as credenciais do cliente selecionado.
- Integração com a API para carregar a lista de seguradoras (`/api/Usuarios/{id}/seguradoras`) e obter senhas em texto claro sob demanda (`/api/Usuarios/{id}/seguradoras/{credId}/senha`).
- Recursos de "Revelar" e "Copiar" credenciais no modal com feedback via Toasts e transições suaves de animação.

## Capabilities

### New Capabilities
- `visualizar-senhas-clientes`: Permite a administradores visualizar e copiar as credenciais e senhas de seguradoras vinculadas a um cliente específico no Web App.

### Modified Capabilities

## Impact

- **UI / Frontend**: `src/components/clientes.jsx` será modificado para incluir o modal e a nova ação na tabela de clientes.
- **Integração com API**: Chamadas HTTP para os endpoints `/api/Usuarios/{id}/seguradoras` e `/api/Usuarios/{id}/seguradoras/{credId}/senha`.
- **UX**: Feedback interativo (Toasts) de sucesso ao copiar senhas para a área de transferência e manipulação elegante de erros.
