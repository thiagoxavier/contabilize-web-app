## Context

A tela `ClientesPage` em `src/components/clientes.jsx` permite aos administradores gerenciar usuários/clientes, perfis de acesso, status e redefinição de senhas. A nova funcionalidade requer que os administradores possam visualizar o "cofre" de seguradoras cadastradas por um determinado cliente e copiar ou revelar essas senhas individualmente de forma segura.

## Goals / Non-Goals

**Goals:**
- Adicionar uma ação com ícone de cadeado (`lock`) na tabela de clientes de `src/components/clientes.jsx` que abra o modal de visualização de cofre.
- Implementar o componente `<CofreClienteModal>` inline no arquivo `clientes.jsx` seguindo o padrão de estilização dos outros componentes modais do projeto.
- Carregar as credenciais da API usando a função utilitária `apiRequest` a partir do endpoint `/api/Usuarios/{id}/seguradoras`.
- Revelar e copiar senhas sob demanda invocando `/api/Usuarios/{id}/seguradoras/{credId}/senha`.
- Exibir toasts de feedback ("Senha copiada com sucesso!") e tratar erros de requisições.

**Non-Goals:**
- Permitir edição, exclusão ou criação de credenciais de seguradora a partir do modal de cofre do cliente (isso deve ser feito apenas pelo próprio cliente em sua área).
- Modificar o fluxo de redefinição de senha do próprio cliente.

## Decisions

### 1. Ícone Utilizado
- **Decisão**: Utilizar o ícone `lock` (cadeado) para a ação de abrir o cofre de credenciais na tabela.
- **Racional**: A ação existente "Resetar Senha" já utiliza o ícone `key` (chave). Usar `lock` previne ambiguidade visual para os administradores.

### 2. Carregamento de Senhas Sob Demanda
- **Decisão**: A listagem inicial no modal trará as senhas mascaradas. A senha descriptografada só será requisitada ao backend quando o administrador clicar expressamente em "Revelar" ou "Copiar".
- **Racional**: Garante que o log de auditoria no backend (gerado a cada leitura da senha em texto claro) seja preciso e reflita exatamente qual credencial foi acessada. Também melhora a performance ao evitar chamadas de descriptografia em lote.

### 3. Integração e Alinhamento Visual
- **Decisão**: O modal seguirá a mesma estrutura de layout dos modais existentes (`UserModal`), utilizando `modal-overlay`, `modal-head`, `modal-body` e `modal-foot`. Para as credenciais, usaremos uma tabela simplificada com colunas para "Seguradora", "Usuário", "Categoria" e "Ações de Senha".

## Risks / Trade-offs

- **Exposição de Senhas na Memória**:
  - *Risco*: Manter senhas decifradas em texto claro no estado do React.
  - *Mitigação*: Armazenar as senhas reveladas em estado transitório local do modal, limpando a memória imediatamente quando o modal for fechado ou a revelação for desativada.
