## Context

A tela de Gestão de Acesso (`src/components/clientes.jsx`) necessita passar por atualizações no formulário de usuário para contemplar a captura de novos atributos pessoais (Telefone, Cargo) e o upload/remoção da foto de perfil, além da integração com a API de definições de campos customizados por tenant.

## Goals / Non-Goals

**Goals:**
- Criar `src/utils/usuariosApi.js` encapsulando os endpoints de campos customizados e upload de foto.
- Atualizar o `UserModal` em `src/components/clientes.jsx` com os novos inputs, seção dinâmica de campos adicionais e header enriquecido no modo de edição.
- Implementar um modal secundário de administração das definições de campos customizados seguindo o padrão de `ModalGerenciarPipelines.jsx`.
- Garantir validação client-side (tamanho/tipo de foto) e feedback de erro/sucesso via `onToast`.

**Non-Goals:**
- Não alterar a tabela principal nem criar colunas adicionais.
- Não modificar lógica de permissões RBAC de frontend além do `geren_usuarios`.
- Não implementar suítes de testes unitários ou e2e inéditas (seguir o padrão de validação `npm run lint` + `npm run build`).

## Decisions

### 1. Encapsulamento em `usuariosApi.js`
- **Decisão**: Criar o arquivo `src/utils/usuariosApi.js` que importa `apiRequest` de `./api`.
- **Alternativas consideradas**: Fazer chamadas diretas via `apiRequest` dentro de `clientes.jsx`.
- **Justificativa**: Conforme o item 3 do PRD e o `CONVENTIONS.md` §2, a inclusão de chamadas a domínios novos exige a criação de um wrapper dedicado.

### 2. Header do Modal (Modo Edição)
- **Decisão**: Restilizar a barra superior do `UserModal` apenas no modo `edit` para exibir avatar circular, iniciais/foto, badge com o nome da Role (em `--gold`), e-mail, telefone, cargo e tag de status.
- **Alternativas consideradas**: Aplicar o novo layout também no modo `new`.
- **Justificativa**: No modo `new` não há dados preenchidos previamente para preencher as informações de contato e status.

### 3. Reuso de Padrão do Modal de Administração
- **Decisão**: Basear o modal de administração de campos customizados no padrão existente em `ModalGerenciarPipelines.jsx`.
- **Alternativas consideradas**: Criar um componente do zero ou adicionar uma página inteiramente nova.
- **Justificativa**: Mantém consistência visual e reduz complexidade técnica.

## Risks / Trade-offs

- **[Upload Multipart no `apiRequest`]** → Se o `apiRequest` atual forçar `Content-Type: application/json`, o envio de FormData com foto pode falhar.
  - *Mitigação*: Ajustar ou tratar `apiRequest` para que, ao receber uma instância de `FormData`, permita que o navegador defina o cabeçalho `Content-Type` correto com boundary.
- **[Definições Inativas com Dados Existentes]** → Usuários antigos com dados em campos cuja definição foi inativada.
  - *Mitigação*: A API `listarCamposCustomizados` retorna apenas campos ativos; o formulário omite o input, mas o objeto `form.camposCustomizados` preserva os dados existentes sem sobrescrevê-los indevidamente ao salvar.
