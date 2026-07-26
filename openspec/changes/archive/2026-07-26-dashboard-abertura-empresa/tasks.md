## 1. Dados mock e domínio

- [x] 1.1 Portar `PIPELINES` (etapas por pipeline `abertura` e `transferencia`) do protótipo para módulo de dados (`src/data/abertura.js` ou extensão de `src/data.js`)
- [x] 1.2 Portar `INITIAL_CLIENTS` (empresas mock com `pipeline`, `columnId`, `responsible`, `checked[]`)
- [x] 1.3 Portar utilitários de domínio: `statusOf(checked)` (pct + status), `getInitials`, `avatarColor`

## 2. Estilos (layout do protótipo + DS do projeto)

- [x] 2.1 Adicionar em `src/styles.css` os estilos do board sob namespace (ex.: `.ae-*`): `board`, `column`, `column-head`, `badge-count`, `cards`, `card`, `progress`, `tag`, `avatar`
- [x] 2.2 Adicionar estilos do modal: `modal-overlay`, `modal`, `modal-header/body/footer`, `checklist-item`, `checkbox`
- [x] 2.3 Converter todos os tokens do protótipo para tokens do projeto conforme o mapa da Diretriz de UI (azul→`--gold`, Roboto→`Be Vietnam Pro`, greys/navy→`--ink/paper/rule/muted`, radii→`--r-*`, shadows→`--shadow-*`); não introduzir token novo

## 3. Componente da tela

- [x] 3.1 Criar `src/components/abertura-empresa.jsx` com `AberturaEmpresaPage` e estado local (`activeTab`, `selectedId`, `clients`)
- [x] 3.2 Implementar abas de pipeline (troca de pipeline fecha modal e limpa seleção)
- [x] 3.3 Implementar `Board` + `Coluna` (título, badge de contagem, estado vazio "Nenhum cliente nesta etapa")
- [x] 3.4 Implementar `CardEmpresa` (nome, tag de status, avatar do responsável, barra de progresso; clique abre modal)

## 4. Modal de detalhes da etapa

- [x] 4.1 Implementar `ModalEtapaDetalhes` com cabeçalho (empresa — etapa), responsável, tag de status e barra de progresso da etapa
- [x] 4.2 Renderizar o checklist da etapa com marcar/desmarcar; recalcular progresso e status ao alternar
- [x] 4.3 Implementar rodapé: "Etapa anterior" (se não for a primeira) e "Concluir e avançar" (habilitado só com checklist completo; move para a próxima etapa)
- [x] 4.4 Fechar via Escape, clique no overlay e botão de fechar, sem alterar a etapa

## 5. Integração no shell + RBAC

- [x] 5.1 Adicionar item de navegação "Abertura de empresa" na `Sidebar`, exibido conforme o código de tela `abertura_empresa`
- [x] 5.2 Adicionar `activeTab === 'abertura'` em `App.jsx` (render condicional + crumbs no `Topbar`)
- [x] 5.3 Ajustar seleção de aba inicial pós-login para considerar a nova tela quando aplicável

## 6. Verificação manual

- [x] 6.1 `npm run lint` sem erros novos
- [x] 6.2 `npm run dev`: navegar pelos dois pipelines, abrir card, marcar checklist, avançar/voltar etapa, fechar modal (ESC/overlay)
- [x] 6.3 Comparar visualmente com o protótipo e confirmar que só tokens do projeto foram usados
