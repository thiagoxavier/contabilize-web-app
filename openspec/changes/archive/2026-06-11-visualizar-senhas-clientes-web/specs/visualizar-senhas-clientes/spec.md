## ADDED Requirements

### Requirement: Action to View Client Vault
A tabela de listagem de clientes na página de Clientes SHALL exibir uma ação dedicada com um ícone de chave (`key` ou `lock`) para cada usuário cadastrado, permitindo que o administrador abra o cofre daquele cliente.

#### Scenario: Open Vault Modal
- **WHEN** o administrador clica no botão com ícone de chave correspondente a um cliente
- **THEN** o modal de visualização do cofre `<CofreClienteModal>` SHALL ser exibido com os dados daquele cliente

### Requirement: List Client Credentials in Vault Modal
O modal de cofre do cliente SHALL carregar dinamicamente e listar as credenciais (seguradoras) cadastradas para o respectivo usuário a partir do endpoint da API `/api/Usuarios/{usuarioId}/seguradoras`.

#### Scenario: Load Credentials Successfully
- **WHEN** o modal é aberto e o backend retorna a lista de credenciais
- **THEN** o sistema exibe os detalhes de cada credencial (Nome da Seguradora, Login/Usuário, Categoria e um campo mascarado para a senha)

#### Scenario: Load Credentials Failure
- **WHEN** o modal é aberto e a API retorna um erro ao obter as credenciais
- **THEN** o sistema exibe uma mensagem de erro amigável na tela e um botão para tentar carregar novamente

### Requirement: Reveal Client Password in Modal
O administrador SHALL conseguir revelar a senha de uma credencial individual em texto claro no modal, disparando uma chamada sob demanda para o endpoint `/api/Usuarios/{usuarioId}/seguradoras/{credencialId}/senha`.

#### Scenario: Reveal Password Clicked
- **WHEN** o administrador clica no ícone de "olho" (Revelar) ao lado da senha mascarada
- **THEN** o sistema realiza a requisição HTTP GET para obter a senha decriptografada e exibe o texto da senha na tela, alterando o ícone para "olho riscado" (Ocultar)

### Requirement: Copy Client Password to Clipboard
O administrador SHALL conseguir copiar a senha descriptografada diretamente para a área de transferência do dispositivo a partir do modal.

#### Scenario: Copy Password Clicked
- **WHEN** o administrador clica no ícone de cópia ao lado da senha de uma credencial
- **THEN** o sistema busca a senha decriptografada na API, salva na área de transferência e exibe um Toast de feedback com a mensagem "Senha copiada com sucesso!"

### Requirement: Modal Accessibility and UX Guidelines
O modal de cofre do cliente SHALL ser acessível por teclado, manter o foco dentro do modal enquanto ativo, permitir fechamento através da tecla "Escape" (ESC), e apresentar transições suaves de fade-in/fade-out ao abrir e fechar.

#### Scenario: Close Modal with Escape Key
- **WHEN** o administrador pressiona a tecla ESC com o modal aberto
- **THEN** o modal é fechado e o foco visual retorna para o botão correspondente da tabela de clientes
