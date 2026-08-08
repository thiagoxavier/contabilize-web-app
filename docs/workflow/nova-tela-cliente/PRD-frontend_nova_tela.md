# PRD — Frontend: novos campos na Gestão de Acesso (Usuário)

> Repo: `web-app-cliente`. Ver também [`web-app-cliente/CLAUDE.md`](../../../web-app-cliente/CLAUDE.md) e [`CONVENTIONS.md`](../../../web-app-cliente/CONVENTIONS.md).
> Depende do PRD de backend ([`PRD-backend.md`](PRD-backend.md)) para os endpoints/DTOs. Documento gerado via brainstorming guiado (skills `brainstorming` + `fable-method`). Fluxo de implementação recomendado: `/opsx:propose` → `/opsx:apply` no repo do frontend.

## 1. Contexto e objetivo

Estender a tela **Gestão de Acesso** (`src/components/clientes.jsx`) para capturar e exibir: **Telefone**, **Cargo/Departamento**, **Foto de perfil**, e um número variável de **campos customizados** definidos por tenant. Inclui uma tela de administração desses campos customizados.

## 2. Não-objetivos

- Sem colunas novas na tabela principal (`<table className="table">`) — os campos novos só aparecem no modal.
- Sem RBAC novo no front — continua sob o código de tela `geren_usuarios` já existente.
- Sem abas de Documentos/DAS/DRE/Atividades do protótipo original (`nova-tela-cliente.html`) — esse conteúdo é de domínio contábil de **Empresa**, não de usuário interno da corretora; descartado nesta feature (ver Decision Log do processo de brainstorming).
- Sem suíte de testes de UI nova (o projeto hoje valida via `npm run lint` + `npm run build`).

## 3. Novo wrapper de API

**`src/utils/usuariosApi.js`** (novo arquivo — hoje `clientes.jsx` chama `apiRequest('/Usuarios...')` direto; `CONVENTIONS.md` §2 manda criar um wrapper de domínio quando faltar):

```js
import { apiRequest } from './api';

export const usuariosApi = {
  listarCamposCustomizados: () => apiRequest('/campos-customizados'),
  salvarCampoCustomizado: (dto) => apiRequest('/campos-customizados', { method: 'POST', body: JSON.stringify(dto) }),
  atualizarCampoCustomizado: (id, dto) => apiRequest(`/campos-customizados/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  excluirCampoCustomizado: (id) => apiRequest(`/campos-customizados/${id}`, { method: 'DELETE' }),
  reordenarCamposCustomizados: (idsEmOrdem) => apiRequest('/campos-customizados/ordem', { method: 'PUT', body: JSON.stringify({ idsEmOrdem }) }),

  enviarFotoUsuario: (id, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    return apiRequest(`/usuarios/${id}/foto`, { method: 'POST', body: formData });
    // Nota de implementação: apiRequest hoje provavelmente fixa Content-Type: application/json;
    // ao implementar, checar se precisa de um modo "multipart" (não setar Content-Type manualmente,
    // deixar o browser definir o boundary).
  },
  removerFotoUsuario: (id) => apiRequest(`/usuarios/${id}/foto`, { method: 'DELETE' }),
};
```

As chamadas de `Usuarios` (CRUD já existente) continuam como estão hoje — só os endpoints novos usam este wrapper (`CONVENTIONS.md` não exige migrar código legado nesta feature).

## 4. Mudanças no `UserModal` (dentro de `clientes.jsx`)

### 4.1 Campos novos no formulário

- **Telefone**: `<input>` texto simples, opcional, sem máscara obrigatória no v1.
- **Cargo/Departamento**: `<input>` texto livre, opcional.
- **Foto de perfil**: preview circular (fallback nas iniciais já existentes via `initials()` quando não há foto); botão "Alterar foto" → `<input type="file" accept="image/jpeg,image/png,image/webp">`; validação client-side de tamanho (≤ 2MB) e tipo antes de habilitar o envio; estado de loading durante o upload (`usuariosApi.enviarFotoUsuario`); erro exibido via `onToast` como os demais fluxos da tela.

### 4.2 Seção "Campos adicionais" (dinâmica)

- Carregada uma vez no mount da página, junto com `roles` (mesmo `Promise.all` do `useEffect` que já existe):
  ```js
  const [camposCustomizados, setCamposCustomizados] = useState([]);
  // adicionar usuariosApi.listarCamposCustomizados() ao Promise.all existente
  ```
- Renderização por `tipo`:
  | Tipo | Elemento |
  |---|---|
  | Texto | `<input type="text">` |
  | Numero | `<input type="number">` |
  | Data | `<input type="date">` |
  | Selecao | `<select>` com `opcoes` |
  | SimNao | `<input type="checkbox">` |
- `obrigatorio: true` → atributo `required`.
- Estado do form: `form.camposCustomizados` como `{ [definicaoId]: valor }`, seguindo o mesmo padrão `set(k, v)` já usado no restante do modal.
- Campos cujo valor já existe no usuário mas cuja definição foi desativada: **não renderizar no formulário** (a definição não vem mais em `listarCamposCustomizados`, que só traz ativas), mas o valor permanece salvo no backend até o usuário ser editado e o campo reaparecer (se reativado).

### 4.3 Header do modal (modo "edit") — visual inspirado no protótipo

Restyle do bloco atual (`<h3>{título}</h3><div class="sub">...</div>`) só no modo `edit`, reaproveitando o layout extraído de `nova-tela-cliente.html`:

- Avatar circular (foto se houver, senão iniciais) à esquerda.
- Rótulo pequeno uppercase, cor `var(--gold)`, acima do nome: nome do **Perfil de Acesso** do usuário (ex: "GERENTE").
- Nome do usuário em destaque (equivalente ao `h1` do protótipo, adaptado ao tamanho do modal).
- Linha de contato abaixo: **E-mail · Telefone · Cargo** (omitir os que estiverem vazios).
- Bloco à direita: badge de **Status** (Ativo/Inativo), reaproveitando o estilo já usado na tabela (`tag-cat` verde/vermelho).
- Cores e espaçamento via CSS Custom Properties existentes (`--gold`, `--ink-500`, `--ink-900`) — nada hardcoded, conforme `CONVENTIONS.md` §3.
- Modo "new" mantém o header simples atual (sem dado ainda para preencher esse layout).

## 5. Nova tela de administração de campos customizados

- Botão **"Gerenciar campos customizados"** no `page-header-actions` de `clientes.jsx`, ao lado de "Novo usuário".
- Abre um modal no mesmo padrão de `ModalGerenciarPipelines.jsx` (já existente no projeto — reaproveitar estrutura em vez de criar um componente do zero):
  - Lista as definições do tenant (nome, tipo, obrigatório, ativo), ordenável (drag ou setas ↑/↓ → chama `reordenarCamposCustomizados`).
  - Form de criar/editar: nome, tipo (select), opções (só visível se tipo = Seleção, lista editável de strings), obrigatório (checkbox).
  - Ação de "excluir" chama `excluirCampoCustomizado` (soft delete no backend) — copy no front deixa claro que é reversível/some da lista mas não perde dados já salvos: *"Este campo deixará de aparecer nos formulários. Os dados já preenchidos por usuários não serão apagados."*

## 6. Estados de erro / loading / vazio

- Falha ao carregar `listarCamposCustomizados`: não bloqueia o resto do modal — a seção "Campos adicionais" simplesmente não aparece, e um `onToast` de erro é disparado (consistente com o tratamento de erro do `loadData` já existente).
- Falha no upload de foto: mantém a foto anterior (ou iniciais) visível, exibe erro via `onToast`, não fecha o modal.
- Nenhum campo customizado cadastrado no tenant: seção "Campos adicionais" não renderiza (sem placeholder vazio necessário — ausência de seção já é autoexplicativa).

## 7. Checklist de conformidade (`CONVENTIONS.md`)

- [ ] Toda rede nova via `usuariosApi.js` — nada de `fetch` solto.
- [ ] Cores/tema via CSS Custom Properties existentes.
- [ ] Loading/erro/vazio tratados nos 3 fluxos novos (foto, campos customizados, admin de definições).
- [ ] Textos em pt-BR; nenhuma foto/telefone logada no console.
- [ ] `npm run lint` e `npm run build` passam após a mudança.
- [ ] Ao implementar, atualizar `docs/contexto/CONTRATO-API.md` (endpoints novos + wrapper `usuariosApi.js`) no mesmo passo que o backend, conforme regra de ouro #2 do `CLAUDE.md` raiz.

## 8. Assumptions confirmadas com o usuário

- Novos campos só no modal — não na grid principal.
- Cargo/Departamento é texto livre, sem dropdown.
- RBAC de tela continua só `geren_usuarios`, sem novo código.
- Header enriquecido só no modo "edit"; "new" mantém o header simples atual.
