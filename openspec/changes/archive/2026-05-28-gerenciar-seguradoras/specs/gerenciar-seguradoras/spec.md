## ADDED Requirements

### Requirement: List and Filter Insurer Credentials (Frontend)
O sistema SHALL listar as seguradoras vinculadas ao usuário autenticado, permitindo busca textual por nome e filtro por categoria (Auto, Saúde, Vida, Multi-ramos, Patrimonial), além de paginação dos resultados.

#### Scenario: Filter by Category
- **WHEN** o usuário seleciona a categoria "Saúde" nos chips de filtro
- **THEN** o frontend exibe apenas as seguradoras retornadas pela API que pertencem à categoria "Saúde"

#### Scenario: Search Textual
- **WHEN** o usuário digita "Porto" na barra de busca
- **THEN** o frontend filtra instantaneamente a lista exibindo as seguradoras correspondentes

### Requirement: Create Insurer Form and Strength Calculator
O formulário de cadastro de seguradora SHALL permitir preenchimento interativo e exibir um indicador visual de força da senha em tempo real, calculando uma escala de 1 a 4.

#### Scenario: Real-time Strength Indicator
- **WHEN** o usuário digita uma senha de 12 caracteres com letras maiúsculas, minúsculas, números e símbolos
- **THEN** o indicador visual de força da senha exibe o nível máximo ("Forte" ou "Muito Forte")

### Requirement: Dynamic Password Reveal and Copy
O usuário SHALL conseguir revelar ou copiar a senha de uma seguradora na lista sob demanda, disparando uma chamada à API para decriptação da senha e exibindo o resultado temporariamente na interface.

#### Scenario: Reveal Password On Demand
- **WHEN** o usuário clica no ícone de olho em uma credencial mascarada
- **THEN** o frontend solicita a senha descriptografada ao endpoint `/api/seguradoras/{id}/senha` e exibe o texto da senha na tela

#### Scenario: Copy Password to Clipboard
- **WHEN** o usuário clica no botão de cópia de senha de uma credencial
- **THEN** o frontend busca a senha descriptografada no backend, copia para a área de transferência e exibe o toast de confirmação "Senha copiada"

### Requirement: Dynamic Sidebar Counter
A contagem de seguradoras exibida na barra lateral (Sidebar) SHALL refletir de forma dinâmica o número de registros reais obtidos do backend, e não a partir de um valor estático (mock).

#### Scenario: Count Sync with API
- **WHEN** a página carrega a lista de seguradoras com sucesso a partir da API com 5 registros
- **THEN** a barra lateral exibe a contagem "5" ao lado do item "Senhas"

### Requirement: Delete Insurer Credential Flow
O frontend SHALL disparar a requisição de exclusão para o backend e remover visualmente o item da tela após a confirmação do usuário.

#### Scenario: Delete Confirmed
- **WHEN** o usuário clica em "Excluir", confirma o alerta "Excluir esta senha?"
- **THEN** o frontend envia a requisição HTTP DELETE e atualiza a lista de seguradoras removendo o item excluído
