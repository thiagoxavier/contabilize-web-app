## 1. UI Integration in ClientesPage

- [x] 1.1 Adicionar botão com ícone de cadeado (`lock`) na tabela de clientes (coluna de ações) com o título "Visualizar Cofre" em `src/components/clientes.jsx`
- [x] 1.2 Declarar o estado local `cofreUser` em `ClientesPage` para controlar qual usuário cliente teve seu cofre aberto em `src/components/clientes.jsx`
- [x] 1.3 Conectar o clique do botão de cadeado para atualizar o estado `cofreUser` em `src/components/clientes.jsx`

## 2. CofreClienteModal Component Implementation

- [x] 2.1 Criar o esqueleto do componente modal `<CofreClienteModal>` em `src/components/clientes.jsx` contendo cabeçalho, corpo e rodapé com layout e estilos do projeto
- [x] 2.2 Implementar o carregamento inicial das credenciais da API invocando `apiRequest` para `/api/Usuarios/{userId}/seguradoras`
- [x] 2.3 Gerenciar estados locais de carregamento (`loading`), erro (`error`) e dados (`credentials`) no modal
- [x] 2.4 Renderizar a listagem de credenciais (Seguradora, Login/Usuário, Categoria) com campo de senha mascarado
- [x] 2.5 Adicionar ação de "Revelar" senha no modal chamando `/api/Usuarios/{userId}/seguradoras/{credId}/senha` e alternando o estado de visualização
- [x] 2.6 Adicionar ação de "Copiar" senha no modal com busca da senha na API, salvamento na área de transferência e feedback visual através de Toast
- [x] 2.7 Adicionar suporte a fechar o modal através da tecla Escape (ESC) e clique no overlay do modal

## 3. Rendering and Manual Verification

- [x] 3.1 Renderizar condicionalmente o `<CofreClienteModal>` em `ClientesPage` se `cofreUser` não for nulo
- [x] 3.2 Testar manualmente no navegador abrindo o modal, revelando/copiando senhas e verificando feedback visual
