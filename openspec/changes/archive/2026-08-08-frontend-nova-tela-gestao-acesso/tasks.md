## 1. Wrapper de API

- [x] 1.1 Criar `src/utils/usuariosApi.js` com suporte aos endpoints de campos customizados e upload/exclusão de foto de perfil.
- [x] 1.2 Verificar e ajustar `src/utils/api.js` (`apiRequest`) para garantir envio correto de `FormData` sem forçar `Content-Type: application/json`.

## 2. Componentes e Formulário do Usuário

- [x] 2.1 Atualizar `UserModal` em `src/components/clientes.jsx` para incluir os campos Telefone e Cargo/Departamento.
- [x] 2.2 Adicionar componente/bloco de Avatar e Upload de Foto no `UserModal` com validação de tamanho (≤ 2MB) e tipo de imagem.
- [x] 2.3 Implementar o carregamento de `usuariosApi.listarCamposCustomizados` no `useEffect` do `UserModal` e renderizar dynamicamente os inputs conforme o tipo do campo.
- [x] 2.4 Atualizar o Header do `UserModal` no modo de edição (`edit`) exibindo avatar, nome do perfil (em `--gold`), nome em destaque, contatos e tag de status.

## 3. Tela de Administração de Campos Customizados

- [x] 3.1 Criar componente de modal de administração de campos customizados (inspirado no `ModalGerenciarPipelines.jsx`).
- [x] 3.2 Implementar listagem, formulário de criação/edição, alternância de obrigatoriedade/desativação, exclusão (soft delete) e reordenação das definições de campos customizados.
- [x] 3.3 Adicionar o botão "Gerenciar campos customizados" na barra de ações (`page-header-actions`) de `clientes.jsx`.

## 4. Validação e Qualidade

- [x] 4.1 Atualizar o contrato de API em `docs/contexto/CONTRATO-API.md` (se aplicável).
- [x] 4.2 Executar `npm run lint` e `npm run build` garantindo build e linting limpos sem erros.
