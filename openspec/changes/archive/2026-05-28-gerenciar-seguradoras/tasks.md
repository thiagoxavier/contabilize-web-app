## 1. Contador Dinâmico da Sidebar

- [x] 1.1 Adicionar um estado para o contador de senhas em `src/App.jsx` (`const [counts, setCounts] = useState(0)`) e passar um callback `onCountChange` para o componente `<SenhasPage>`
- [x] 1.2 Atualizar o `<Sidebar>` em `src/App.jsx` para utilizar o estado dinâmico `counts` (`counts={{ senhas: counts }}`) em vez do tamanho do mock `SEGURADORAS.length`
- [x] 1.3 Chamar o callback `onCountChange` em `src/components/senhas.jsx` sempre que a lista de credenciais for carregada da API, ou quando itens forem criados ou excluídos

## 2. Ajustes e Tratamento de Erros de Integração da API

- [x] 2.1 Garantir que todas as chamadas de API em `src/components/senhas.jsx` (`/seguradoras`, `/seguradoras/{id}/senha`, etc.) estejam formatadas corretamente e tratando erros de rede ou de validação com mensagens claras via toast
- [x] 2.2 Tratar o fluxo do modal ao criar/editar para garantir que o payload enviado e retornado corresponda às expectativas do frontend (recarregando e mapeando as propriedades do item atualizado)

## 3. Validação e Testes Manuais

- [x] 3.1 Executar a aplicação localmente e validar o carregamento inicial de senhas a partir do banco de dados real através do backend
- [x] 3.2 Validar a criação de uma nova seguradora verificando se a senha é criptografada e o indicador de força reflete as regras locais
- [x] 3.3 Validar a revelação/cópia de senha sob demanda e a exclusão com diálogo de confirmação
- [x] 3.4 Validar se o número exibido na barra lateral altera dinamicamente após criar ou excluir uma seguradora
