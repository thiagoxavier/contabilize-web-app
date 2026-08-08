## ADDED Requirements

### Requirement: Exibição e Captura de Telefone, Cargo e Foto no Modal do Usuário
O modal de usuário SHALL exibir e permitir o preenchimento dos campos Telefone e Cargo/Departamento, além de possibilitar o upload e remoção da foto de perfil.

#### Scenario: Preenchimento de Telefone e Cargo
- **WHEN** o usuário abre o modal de usuário e preenche os campos Telefone e Cargo/Departamento
- **THEN** os valores digitados devem ser mantidos no estado do formulário e enviados ao salvar o usuário.

#### Scenario: Upload de foto com sucesso
- **WHEN** o usuário escolhe um arquivo de imagem válido (≤ 2MB, formato jpeg/png/webp) e aciona o envio de foto
- **THEN** o sistema envia o arquivo via `usuariosApi.enviarFotoUsuario` e atualiza o preview da foto de perfil.

#### Scenario: Upload de foto excedendo limite de tamanho
- **WHEN** o usuário escolhe um arquivo de imagem com tamanho maior que 2MB
- **THEN** o sistema impede o envio e exibe um toast de erro.

### Requirement: Renderização Dinâmica da Seção de Campos Adicionais
O formulário do usuário SHALL carregar e renderizar dinamicamente os campos customizados ativos do tenant.

#### Scenario: Carregamento dos campos customizados ativos
- **WHEN** o modal de Usuário é aberto
- **THEN** o sistema carrega as definições ativas por meio de `usuariosApi.listarCamposCustomizados` e renderiza os inputs conforme seus tipos (Texto, Numero, Data, Selecao, SimNao).

#### Scenario: Validação de campos obrigatórios
- **WHEN** um campo customizado possui a propriedade `obrigatorio: true`
- **THEN** o elemento renderizado deve conter o atributo `required`.

### Requirement: Header Enriquecido no Modo de Edição
O header do modal de Usuário SHALL apresentar uma estrutura visual enriquecida quando em modo de edição (`edit`).

#### Scenario: Exibição do Header de Edição
- **WHEN** o modal é aberto para editar um usuário existente
- **THEN** o topo do modal exibe o avatar circular, o perfil de acesso em destaque com estilo `--gold`, o nome do usuário em destaque, os dados de contato (email, telefone, cargo) e a tag de status (Ativo/Inativo).

### Requirement: Administração de Definições de Campos Customizados
O sistema SHALL disponibilizar uma interface modal administrativa para gestão de campos customizados do tenant.

#### Scenario: Criação de novo campo customizado
- **WHEN** o administrador abre o modal de gestão de campos customizados e preenche nome, tipo e obrigatoriedade
- **THEN** o sistema envia os dados via `usuariosApi.salvarCampoCustomizado` e recarrega a lista de definições.

#### Scenario: Reordenação de campos customizados
- **WHEN** o administrador altera a ordem das definições de campos customizados
- **THEN** o sistema dispara `usuariosApi.reordenarCamposCustomizados` salvando a nova sequência de IDs.
