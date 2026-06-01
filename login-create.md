# Especificação de Feature: Criação da Tela de Login (Central do Cliente)
**Status:** Em Revisão (Brainstorming)  
**Alvo Técnico:** [portal-cliente](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente)  
**Protótipo de Referência:** [Login.html](file:///c:/contabilize-seguro/prototipo-seguro/Login.html) (baseado em [login_raw.html](file:///c:/contabilize-seguro/prototipo-seguro/login_raw.html))

---

## 1. Visão Geral e Contexto
A Central do Cliente atualmente inicializa diretamente no painel de Senhas (dashboard). Para proteger o acesso às credenciais das seguradoras parceiras e assegurar conformidade com a LGPD e SUSEP, é necessária a criação de um fluxo de autenticação robusto e seguro.

Esta especificação detalha os refinamentos e decisões de arquitetura para implementar o fluxo de login em React no projeto [portal-cliente](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente).

---

## 2. Resultados do Brainstorming: Refinamentos e Melhorias
A partir da análise do protótipo estático, definimos as seguintes melhorias técnicas para a versão integrada em React:

| Funcionalidade no Protótipo | Refinamento / Proposta em React | Benefício de UX/Engenharia |
| :--- | :--- | :--- |
| **Painéis Estáticos (Direct DOM)** | Gerenciamento via Estado Central (`currentPanel`: `'login'`, `'forgot'`, `'mfa'`, `'success'`) com renderização condicional. | Elimina manipulação direta do DOM, tornando a transição entre painéis reativa e robusta. |
| **MFA OTP Inputs (DOM inputs)** | Componente modularizado `<OtpInput>` usando um array de referências (`useRef`) para gerenciar foco de forma reativa. | Garante auto-tabbing suave, suporte a colar (Ctrl+V) de 6 dígitos, navegação por setas (esquerda/direita) e exclusão inteligente com Backspace. |
| **Co-branding / White-label** | Integração direta com as variáveis CSS de destaque do portal (`--gold`, `--gold-deep`) e persistência do tema (Contabilize Seguro vs Nexa Corretora). | Mantém a consistência visual. A tela de login reflete instantaneamente o tema ativo ou o tenant/domínio configurado. |
| **Validador de E-mail Corporativo** | Feedback imediato no evento `onChange` com expressões regulares. Exibe um banner de aviso caso seja detectado um e-mail pessoal (Gmail, Outlook, etc.). | Aumenta a segurança corporativa, guiando o corretor a usar sua conta corporativa. |
| **MFA Countdown Timer** | Estado reativo com `useEffect` e `setInterval`. Quando zerado, ativa o botão de reenvio mantendo o foco do teclado de forma acessível. | Melhora a acessibilidade (A11y) e garante limpeza de timers para evitar vazamentos de memória (memory leaks). |
| **Indicador de Força da Senha** | Algoritmo de entropia em tempo real baseado em critérios claros (comprimento, números, maiúsculas/minúsculas e caracteres especiais). | Informa visualmente sobre a robustez da senha durante a redefinição. |

---

## 3. Casos de Uso (Use Cases)
*   **Acesso Seguro:** Como corretor parceiro, quero autenticar-me usando minhas credenciais corporativas e validar meu acesso via token MFA para visualizar as senhas de seguradoras.
*   **Co-branding Visível:** Como cliente da Nexa Corretora, quero ver o logotipo e as cores da Nexa na tela de login para sentir confiança no ambiente white-label.
*   **Recuperação Autônoma:** Como corretor que esqueceu a senha, quero solicitar um código temporário de redefinição por e-mail para recuperar meu acesso de forma independente.
*   **Validação de E-mail:** Como administrador de segurança, quero que o sistema alerte os corretores quando utilizarem e-mails pessoais (ex: gmail) para reforçar o uso de domínios corporativos seguros.

---

## 4. Requisitos Funcionais (FR)

### FR-01: Painel de Login
*   **Campos de Entrada:** Inputs obrigatórios de e-mail e senha.
*   **Alternância de Senha:** Botão de reveal (olho) para alternar o tipo do input entre `password` e `text`.
*   **Validação de E-mail Pessoal:** Se o domínio digitado estiver na lista de e-mails pessoais (`gmail.com`, `outlook.com`, `hotmail.com`, `yahoo.com`, `uol.com.br`, etc.), exibir um aviso amigável recomendando o uso de e-mail corporativo.
*   **Login Social:** Botões integrados para fluxo OAuth simulado via Google, Microsoft e Apple.

### FR-02: Recuperação de Senha (Forgot Password)
*   **Passo 1 (Envio):** Campo para inserir o e-mail cadastrado e enviar o código de redefinição.
*   **Passo 2 (Verificação e Redefinição):** Campos para inserir o código de 6 dígitos recebido por e-mail e definir a nova senha.
*   **Força da Senha:** Medidor visual dinâmico com 4 níveis (Fraca, Média, Forte, Excelente) baseado em regras de caracteres.
*   **Confirmação:** Validação em tempo real garantindo que a confirmação da senha seja idêntica à nova senha digitada.

### FR-03: Verificação MFA (MFA Panel)
*   **Código de 6 dígitos:** Inputs numéricos individuais com comportamento de auto-tabbing.
*   **Temporizador:** Timer de 60 segundos com contagem regressiva para expiração do código.
*   **Reenvio de Código:** Link de reenvio que permanece desativado (opacidade reduzida) até o timer zerar. Ao zerar, ativa o botão e permite solicitar um novo código.

### FR-04: Suporte a Co-branding (White-label)
*   **Seletor Demo:** Widget no rodapé (para demonstração/tweak) que permite alternar o tema do login entre:
    *   **Contabilize Seguro:** Identidade padrão, cores douradas e cinza-escuro.
    *   **Nexa Corretora:** Identidade parceira, cores verde esmeralda e azul profundo.
*   **Configuração Dinâmica:** A alteração do tema atualiza dinamicamente as variáveis CSS `--brand-primary`, `--brand-primary-deep`, `--brand-bg-panel` e altera textos, logotipos e ilustrações da marca.

---

## 5. Requisitos Não-Funcionais (NFR) & UX

*   **Acessibilidade (A11y):**
    *   Foco visível e nítido em todos os campos usando a cor `--brand-primary`.
    *   Navegação por teclado completa (tecla `Enter` envia formulários; setas navegam entre campos MFA).
    *   Uso de `aria-live` em mensagens de erro/sucesso e atributos ARIA adequados.
*   **Transições e Micro-animações:**
    *   Mudanças de painéis devem usar animações fluidas de `fade-in` e pequenos deslocamentos verticais (`translateY`) com velocidade de `200ms` e curva de facilitação `cubic-bezier(0.4, 0, 0.2, 1)`.
*   **Responsividade:**
    *   Layout em duas colunas (painel de marca à esquerda e formulário à direita) em resoluções de desktop.
    *   Em telas menores que `960px`, o painel de marca esquerdo é ocultado, centralizando o formulário para melhorar a experiência em dispositivos móveis.

---

## 6. Proposta de Arquitetura em React

### 6.1. Fluxo de Estado no Componente Principal
No arquivo [App.jsx](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente/src/App.jsx), adicionaremos um estado para gerenciar o usuário autenticado (`user`).

```jsx
const [user, setUser] = useState(null); // null = não autenticado, objeto = autenticado
```

*   Se `user === null`, renderiza o componente `<LoginScreen onLoginSuccess={setUser} />`.
*   Se `user !== null`, renderiza o shell da aplicação com a `<Sidebar />` e a `<SenhasPage />`.

### 6.2. Componentização do Fluxo de Login
Criaremos o arquivo [src/components/login.jsx](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente/src/components/login.jsx) que irá exportar o componente principal `<LoginScreen />` e conterá as views internas como componentes auxiliares focados:

```
<LoginScreen>
  ├── <BrandPanel /> (Painel lateral esquerdo com a marca)
  └── <FormContainer>
        ├── <LoginForm /> (Painel de Login padrão)
        ├── <ForgotPassForm /> (Fluxo de redefinição de senha)
        ├── <MfaForm /> (Fluxo de validação do código de 6 dígitos)
        └── <SuccessPanel /> (Confirmação de acesso autorizado)
```

### 6.3. O Componente Reutilizável `<OtpInput>`
Para gerenciar a digitação do código MFA, criamos um subcomponente focado:

```jsx
function OtpInput({ length = 6, value, onChange }) {
  const inputRefs = useRef([]);

  // Lógica para auto-tabbing, exclusão com Backspace,
  // navegação por setas e colar (Ctrl+V) de código completo.
}
```

---

## 7. Detalhes de Arquivos a Serem Modificados / Criados

### [MODIFY] [App.jsx](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente/src/App.jsx)
*   Importar `<LoginScreen />` do novo arquivo `components/login.jsx`.
*   Inserir controle de fluxo de autenticação condicional no retorno da função principal.
*   Conectar o tema ativo (Controlado via tweaks) para que a tela de login e o painel de senhas usem o mesmo estado compartilhado de cor e branding.

### [NEW] [login.jsx](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente/src/components/login.jsx)
*   Criar o componente principal `<LoginScreen />`.
*   Codificar a lógica de alternância de painéis e validações (e-mail, força de senha, timer MFA).
*   Estruturar os componentes auxiliares de formulários e o componente modular de OTP.

### [MODIFY] [styles.css](file:///c:/contabilize-seguro/web-app-cliente/portal-cliente/src/styles.css)
*   Adicionar as classes CSS específicas da tela de login (Grid de duas colunas, animações de entrada de formulários, alertas vermelhos de erro e amarelos de aviso).
*   Garantir responsividade no breakpoint de `960px` para celulares e tablets.

---

## 8. Plano de Verificação e Testes

### Testes Manuais
1.  **Fluxo de Login Feliz:** Digitar e-mail corporativo válido, senha fictícia, clicar em "Entrar", digitar 6 dígitos quaisquer no MFA, e verificar redirecionamento para o dashboard com as iniciais do e-mail no avatar.
2.  **Validador de E-mail:** Inserir `corretor@gmail.com` e validar se o banner de aviso amarelo sobre e-mail pessoal é renderizado instantaneamente.
3.  **Força da Senha:** Na tela de esqueci senha, digitar senhas de tamanhos e caracteres variados e certificar-se de que a barra e a legenda refletem a força correta (Fraca, Média, Forte, Excelente).
4.  **Auto-tabbing e Colar MFA:**
    *   Digitar números no MFA e certificar-se de que o cursor avança sozinho.
    *   Pressionar Backspace e ver se o cursor retorna ao campo anterior apagando o número.
    *   Colar o código `123456` usando Ctrl+V no primeiro campo e verificar se ele preenche todos os campos automaticamente e dispara a validação.
5.  **Co-branding dinâmico:** Mudar o seletor visual no widget do rodapé da tela de login e certificar-se de que as cores, logotipo e cópias mudam perfeitamente.
