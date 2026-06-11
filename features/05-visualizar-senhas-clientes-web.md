# F05 - Visualizar Senhas de Clientes - Web App

**Status:** 🟡 Planejado | **Prioridade:** 🟢 Alta | **Complexidade:** ⭐⭐

## 📋 Descrição

Implementa a interface do usuário (UI/UX) para permitir que o Administrador visualize as credenciais e senhas cadastradas pelos clientes/usuários diretamente a partir da tela de listagem de Clientes.

## 🎯 Objetivos

- Adicionar ação de visualizar cofre na tabela de Clientes (`ClientesPage`).
- Apresentar o cofre de credenciais de forma elegante e responsiva em um modal/drawer.
- Integrar com os novos endpoints da API (`/api/Usuarios/{id}/seguradoras` e `/api/Usuarios/{id}/seguradoras/{credId}/senha`).
- Prover recursos de "Revelar" e "Copiar" credenciais no modal.

---

## 🎨 Frontend Specification

### 1. Novo Componente `<CofreClienteModal>` em `clientes.jsx`

Um modal estilizado para gerenciar a exibição/cópia das credenciais:

```jsx
function CofreClienteModal({ user, onClose, onToast }) {
  // Carrega credenciais usando apiRequest(`/Usuarios/${user.id}/seguradoras`)
  // Gerencia revelação e cópia disparando apiRequest(`/Usuarios/${user.id}/seguradoras/${id}/senha`)
}
```

### 2. Integração em `ClientesPage` (`clientes.jsx`)

- Adicionar botão com ícone de chave (`key` ou `lock`) na coluna de ações para cada usuário na tabela.
- Clicar no botão abrirá o modal passando os dados do usuário.

---

## 🔒 Considerações de Experiência e Acessibilidade

- **Acessibilidade:** Suporte completo para teclado e navegação de foco no modal.
- **Micro-animações:** Transição suave de fade-in no modal-overlay e de entrada no modal.
- **Feedback:** Uso de Toasts ao copiar ou em caso de erros na busca da credencial.
