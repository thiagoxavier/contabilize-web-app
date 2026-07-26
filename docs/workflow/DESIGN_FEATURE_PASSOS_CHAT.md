# Design: Feature Unificada — Passos + Chat por Etapa

**Data:** 2026-07-15  
**Status:** ✅ Aprovado  
**Versão:** 1.0  

---

## 📋 Sumário Executivo

Este documento especifica uma **feature unificada** que evolui o prototipo Kanban existente de abertura de empresas, adicionando:

1. **Decomposição de Passos:** Cada etapa (Jornada, Viabilidade, etc.) pode conter múltiplos passos menores
2. **Chat por Passo:** Cada passo tem um histórico colaborativo de mensagens
3. **Sincronização via Polling:** Atualizações a cada 5-10 segundos quando modal está aberto

**Objetivo:** Reduzir tempo de execução, melhorar qualidade e fortalecer colaboração entre operadores.

**Escala:** 5 operadores simultâneos, ~10 empresas em abertura, SLA 8h

---

## 🎯 Understanding Confirmado

### O que está sendo construído

Uma feature unificada que evolui o prototipo HTML existente:
- Desdobra cada empresa em **Etapas** → **Passos** (2 níveis hierárquicos)
- Integra um **chat para histórico colaborativo** (quem fez o quê, quando, por quê)
- Permite **edição otimista** com sincronização via polling
- Tudo focado em **operadores/contadores** executando passos individuais

### Por que existe

- ⏱️ **Reduzir tempo de execução** (menos caçada por informação)
- ✅ **Melhorar qualidade** (histórico documentado evita retrabalho)
- 🤝 **Fortalecer colaboração** (contexto centralizado, sem email perdido)

### Quem usa

- **5 operadores simultâneos** trabalhando em ~**10 empresas em abertura**
- Perfil: Contadores/operadores que executam passos individuais
- **Não é para gestores** verem overview consolidada

### Constraints

- **SLA:** 8 horas para completar um processo
- **Histórico:** Armazenado indefinidamente (sem expurgo)
- **Sincronização:** Polling a cada 5-10s (sem WebSocket)
- **Escalabilidade:** Otimizada para 5 users, não 500

### Non-Goals (Fora do Escopo)

- ❌ Relatórios automáticos / BI
- ❌ Integrações com Google Drive / Sharepoint
- ❌ Subtarefas recursivas (passos não viram árvores)
- ❌ Notificações push/email em tempo real
- ❌ IA/Semantic Kernel no chat

---

## 📊 Decision Log

| # | Decisão | Alternativas | Por quê |
|---|---------|--------------|--------|
| **D1** | Feature unificada (dashboard + passos + chat) | Três features isoladas | Melhor UX; contexto centralizado |
| **D2** | Usuários: operadores/contadores | Gestores supervisores | Precisa de granularidade e execução |
| **D3** | Sucesso = Tempo + Qualidade + Colaboração | Uma única métrica | Balanceado; reflete valor real |
| **D4** | Escala: 5 operadores, 10 empresas, 8h SLA | Escalas maiores | Realístico para esta fase |
| **D5** | Passos como entidades separadas (SQL) | JSON embutido | Flexibilidade e rastreabilidade |
| **D6** | Chat por Passo | Chat por Etapa/Empresa | Contexto localizado reduz noise |
| **D7** | Admin deleta, operadores editam suas próprias | Regra mais aberta | Auditoria e accountability |
| **D8** | Chat sem IA | Com sugestões via Semantic Kernel | Escopo enxuto; valor imediato |
| **D9** | Polling 5-10s (sem WebSocket) | WebSocket/SSE | 5 users não justifica complexidade |
| **D10** | Mensagens seguem passo se movido | Chat fica órfão | Histórico é ativo da tarefa |
| **D11** | 3-layer Backend (Controller→Service→Repo) | CQRS/Event Sourcing | Alinhado com arquitetura existente |
| **D12** | React Hooks + Context (sem Redux) | Redux/Zustand | Context suficiente para 5 users |

---

## 🏗️ Arquitetura

### Padrão Escolhido

**Estrutura SQL Plana + React Hooks + Polling**

```
Empresa (id, nome, ...)
  ├─ Etapa (id, empresaId, label, ordem, ...)
  │   └─ Passo (id, etapaId, título, status, responsável, ...)
  │       └─ Mensagem (id, passoId, usuário, texto, dataHora, deletadoEm)
```

**Trade-offs:**
- ✅ Simples, SQL direto, sem triggers complexos
- ✅ Fácil migração do prototipo existente
- ✅ Escalável para 5 users + 10 empresas
- ⚠️ Deletar etapa exige cascata (usar soft-deletes)
- ⚠️ Sem transações distribuídas (não é problema para 8h SLA)

---

## 🔌 Backend — Especificação Completa

### Entidades (Modelos C#)

```csharp
public class Passo
{
  public Guid Id { get; set; }
  public Guid EtapaId { get; set; }
  public string Titulo { get; set; }
  public string Descricao { get; set; }
  public int Status { get; set; } // 0=Não iniciado, 1=Em andamento, 2=Concluído
  public Guid? ResponsavelId { get; set; }
  public int OrdenExibicao { get; set; }
  public DateTime DataCriacao { get; set; }
  public DateTime? DataAtualizacao { get; set; }
  public ICollection<MensagemPasso> Mensagens { get; set; } = new List<MensagemPasso>();
}

public class MensagemPasso
{
  public Guid Id { get; set; }
  public Guid PassoId { get; set; }
  public Guid UsuarioId { get; set; }
  public string Texto { get; set; }
  public DateTime DataCriacao { get; set; }
  public DateTime? DataEdicao { get; set; }
  public DateTime? DeletadoEm { get; set; } // soft-delete (apenas admin)
}
```

### DTOs

```csharp
public record PassoDto(
  Guid Id,
  string Titulo,
  string Descricao,
  int Status,
  Guid? ResponsavelId,
  int OrdenExibicao,
  DateTime DataCriacao,
  DateTime? DataAtualizacao,
  List<MensagemPassoDto> Mensagens
);

public record CriarPassoDto(
  string Titulo,
  string Descricao,
  Guid? ResponsavelId
);

public record AtualizarPassoDto(
  string Titulo,
  string Descricao,
  int Status,
  Guid? ResponsavelId
);

public record MensagemPassoDto(
  Guid Id,
  Guid UsuarioId,
  string NomeUsuario,
  string Texto,
  DateTime DataCriacao,
  DateTime? DataEdicao,
  bool EstaDeleta
);

public record CriarMensagemDto(string Texto);
public record AtualizarMensagemDto(string Texto);
```

### APIs (Controllers)

#### **PassosController**

```csharp
[ApiController]
[Route("api/[controller]")]
[RequireRateLimiting("IaPolicy")]
public class PassosController : ControllerBase
{
  private readonly IPassoService _passoService;
  
  // GET /api/passos/etapa/{etapaId}
  [HttpGet("etapa/{etapaId}")]
  public async Task<ActionResult<List<PassoDto>>> ListarPorEtapa(Guid etapaId)
    => Ok(await _passoService.ListarPorEtapaAsync(etapaId));
  
  // GET /api/passos/{passoId}
  [HttpGet("{passoId}")]
  public async Task<ActionResult<PassoDto>> ObterPorId(Guid passoId)
    => Ok(await _passoService.ObterPorIdAsync(passoId));
  
  // POST /api/passos
  [HttpPost]
  public async Task<ActionResult<PassoDto>> Criar([FromBody] CriarPassoDto dto)
  {
    var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
    var resultado = await _passoService.CriarAsync(dto.EtapaId, dto, usuarioId);
    return CreatedAtAction(nameof(ObterPorId), new { passoId = resultado.Id }, resultado);
  }
  
  // PUT /api/passos/{passoId}
  [HttpPut("{passoId}")]
  public async Task<ActionResult<PassoDto>> Atualizar(Guid passoId, [FromBody] AtualizarPassoDto dto)
  {
    var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
    return Ok(await _passoService.AtualizarAsync(passoId, dto, usuarioId));
  }
  
  // DELETE /api/passos/{passoId} (apenas admin)
  [HttpDelete("{passoId}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Deletar(Guid passoId)
  {
    await _passoService.DeletarAsync(passoId);
    return NoContent();
  }
}
```

#### **MensagensPassoController**

```csharp
[ApiController]
[Route("api/[controller]")]
[RequireRateLimiting("IaPolicy")]
public class MensagensPassoController : ControllerBase
{
  private readonly IMensagemPassoService _mensagemService;
  
  // GET /api/mensagens-passo/{passoId}
  [HttpGet("{passoId}")]
  public async Task<ActionResult<List<MensagemPassoDto>>> Listar(Guid passoId)
    => Ok(await _mensagemService.ListarAsync(passoId));
  
  // POST /api/mensagens-passo
  [HttpPost]
  public async Task<ActionResult<MensagemPassoDto>> Criar([FromBody] CriarMensagemDto dto)
  {
    var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
    var resultado = await _mensagemService.CriarAsync(dto.PassoId, dto, usuarioId);
    return CreatedAtAction(nameof(Listar), new { passoId = dto.PassoId }, resultado);
  }
  
  // PUT /api/mensagens-passo/{mensagemId}
  [HttpPut("{mensagemId}")]
  public async Task<ActionResult<MensagemPassoDto>> Atualizar(Guid mensagemId, [FromBody] AtualizarMensagemDto dto)
  {
    var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
    return Ok(await _mensagemService.AtualizarAsync(mensagemId, dto, usuarioId));
  }
  
  // DELETE /api/mensagens-passo/{mensagemId} (apenas admin)
  [HttpDelete("{mensagemId}")]
  [Authorize(Roles = "Admin")]
  public async Task<IActionResult> Deletar(Guid mensagemId)
  {
    await _mensagemService.DeletarAsync(mensagemId);
    return NoContent();
  }
}
```

### Services

#### **IPassoService**

```csharp
public interface IPassoService
{
  Task<PassoDto> ObterPorIdAsync(Guid id);
  Task<List<PassoDto>> ListarPorEtapaAsync(Guid etapaId);
  Task<PassoDto> CriarAsync(Guid etapaId, CriarPassoDto dto, Guid usuarioId);
  Task<PassoDto> AtualizarAsync(Guid passoId, AtualizarPassoDto dto, Guid usuarioId);
  Task DeletarAsync(Guid passoId);
}

public class PassoService : IPassoService
{
  private readonly IPassoRepository _passoRepository;
  private readonly IEtapaRepository _etapaRepository;
  
  public async Task<PassoDto> CriarAsync(Guid etapaId, CriarPassoDto dto, Guid usuarioId)
  {
    var etapa = await _etapaRepository.ObterPorIdAsync(etapaId);
    if (etapa == null) throw new NotFoundException("Etapa não encontrada");
    
    var proximaOrdem = await _passoRepository.ObterProximaOrdemAsync(etapaId);
    var passo = new Passo
    {
      Id = Guid.NewGuid(),
      EtapaId = etapaId,
      Titulo = dto.Titulo,
      Descricao = dto.Descricao,
      ResponsavelId = dto.ResponsavelId,
      Status = 0, // Não iniciado
      OrdenExibicao = proximaOrdem,
      DataCriacao = DateTime.UtcNow
    };
    
    await _passoRepository.AdicionarAsync(passo);
    return MapearParaDto(passo);
  }
  
  public async Task<PassoDto> AtualizarAsync(Guid passoId, AtualizarPassoDto dto, Guid usuarioId)
  {
    var passo = await _passoRepository.ObterPorIdAsync(passoId);
    if (passo == null) throw new NotFoundException("Passo não encontrado");
    
    passo.Titulo = dto.Titulo;
    passo.Descricao = dto.Descricao;
    passo.Status = dto.Status;
    passo.ResponsavelId = dto.ResponsavelId;
    passo.DataAtualizacao = DateTime.UtcNow;
    
    await _passoRepository.AtualizarAsync(passo);
    return MapearParaDto(passo);
  }
  
  public async Task DeletarAsync(Guid passoId)
  {
    var passo = await _passoRepository.ObterPorIdAsync(passoId);
    if (passo == null) throw new NotFoundException();
    
    // Soft-delete: manter histórico
    await _passoRepository.DeletarAsync(passoId);
  }
  
  private PassoDto MapearParaDto(Passo passo) => new(
    passo.Id,
    passo.Titulo,
    passo.Descricao,
    passo.Status,
    passo.ResponsavelId,
    passo.OrdenExibicao,
    passo.DataCriacao,
    passo.DataAtualizacao,
    passo.Mensagens?.Select(m => MapearMensagemParaDto(m)).ToList() ?? []
  );
  
  private MensagemPassoDto MapearMensagemParaDto(MensagemPasso msg) => new(
    msg.Id,
    msg.UsuarioId,
    "Nome do Usuário", // TODO: buscar nome real
    msg.Texto,
    msg.DataCriacao,
    msg.DataEdicao,
    msg.DeletadoEm.HasValue
  );
}
```

#### **IMensagemPassoService**

```csharp
public interface IMensagemPassoService
{
  Task<List<MensagemPassoDto>> ListarAsync(Guid passoId);
  Task<MensagemPassoDto> CriarAsync(Guid passoId, CriarMensagemDto dto, Guid usuarioId);
  Task<MensagemPassoDto> AtualizarAsync(Guid mensagemId, AtualizarMensagemDto dto, Guid usuarioId);
  Task DeletarAsync(Guid mensagemId);
}

public class MensagemPassoService : IMensagemPassoService
{
  private readonly IMensagemPassoRepository _mensagemRepository;
  private readonly IUsuarioRepository _usuarioRepository;
  
  public async Task<MensagemPassoDto> CriarAsync(Guid passoId, CriarMensagemDto dto, Guid usuarioId)
  {
    var mensagem = new MensagemPasso
    {
      Id = Guid.NewGuid(),
      PassoId = passoId,
      UsuarioId = usuarioId,
      Texto = dto.Texto,
      DataCriacao = DateTime.UtcNow
    };
    
    await _mensagemRepository.AdicionarAsync(mensagem);
    var usuario = await _usuarioRepository.ObterPorIdAsync(usuarioId);
    return MapearParaDto(mensagem, usuario?.Nome ?? "Desconhecido");
  }
  
  public async Task<MensagemPassoDto> AtualizarAsync(Guid mensagemId, AtualizarMensagemDto dto, Guid usuarioId)
  {
    var mensagem = await _mensagemRepository.ObterPorIdAsync(mensagemId);
    if (mensagem == null) throw new NotFoundException();
    
    // Operador só pode editar mensagens próprias
    if (mensagem.UsuarioId != usuarioId) throw new ForbiddenException("Acesso negado");
    
    mensagem.Texto = dto.Texto;
    mensagem.DataEdicao = DateTime.UtcNow;
    
    await _mensagemRepository.AtualizarAsync(mensagem);
    var usuario = await _usuarioRepository.ObterPorIdAsync(usuarioId);
    return MapearParaDto(mensagem, usuario?.Nome ?? "Desconhecido");
  }
  
  public async Task DeletarAsync(Guid mensagemId)
  {
    var mensagem = await _mensagemRepository.ObterPorIdAsync(mensagemId);
    if (mensagem == null) throw new NotFoundException();
    
    mensagem.DeletadoEm = DateTime.UtcNow; // soft-delete
    await _mensagemRepository.AtualizarAsync(mensagem);
  }
  
  private MensagemPassoDto MapearParaDto(MensagemPasso msg, string nomeUsuario) => new(
    msg.Id,
    msg.UsuarioId,
    nomeUsuario,
    msg.Texto,
    msg.DataCriacao,
    msg.DataEdicao,
    msg.DeletadoEm.HasValue
  );
}
```

### Repositories

```csharp
public interface IPassoRepository
{
  Task<Passo> ObterPorIdAsync(Guid id);
  Task<List<Passo>> ListarPorEtapaAsync(Guid etapaId);
  Task<int> ObterProximaOrdemAsync(Guid etapaId);
  Task AdicionarAsync(Passo passo);
  Task AtualizarAsync(Passo passo);
  Task DeletarAsync(Guid id);
}

public interface IMensagemPassoRepository
{
  Task<MensagemPasso> ObterPorIdAsync(Guid id);
  Task<List<MensagemPasso>> ListarPorPassoAsync(Guid passoId); // Exclui deletadas
  Task AdicionarAsync(MensagemPasso mensagem);
  Task AtualizarAsync(MensagemPasso mensagem);
}
```

---

## ⚛️ Frontend — Especificação Completa

### Estrutura de Componentes

```
App.jsx (existente)
├─ Dashboard.jsx (atualizado)
│  ├─ EmpresaCard.jsx (existente)
│  └─ ModalEtapaDetalhes.jsx (NEW)
│     ├─ AbaPassos.jsx (NEW)
│     │  └─ CardPasso.jsx (NEW)
│     │     └─ ChatPasso.jsx (NEW)
│     │        ├─ ListaMensagens.jsx (NEW)
│     │        └─ FormMensagem.jsx (NEW)
│     └─ AbaInfo.jsx (existente)
```

### Context: PassosContext

```jsx
// contexts/PassosContext.jsx
export function PassosProvider({ children }) {
  const [passos, setPassos] = useState({});        // { etapaId: [passo1, ...] }
  const [mensagens, setMensagens] = useState({});  // { passoId: [msg1, ...] }
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

  // Funções públicas
  const carregarPassos = useCallback(async (etapaId) => { /* ... */ }, []);
  const carregarMensagens = useCallback(async (passoId) => { /* ... */ }, []);
  const criarPasso = useCallback(async (etapaId, dados) => { /* ... */ }, []);
  const atualizarPasso = useCallback(async (passoId, dados) => { /* ... */ }, []);
  const criarMensagem = useCallback(async (passoId, dados) => { /* ... */ }, []);
  const atualizarMensagem = useCallback(async (mensagemId, dados) => { /* ... */ }, []);
  const iniciarPolling = useCallback((etapaId, passoId, intervaloMs) => { /* ... */ }, []);
  const pararPolling = useCallback(() => { /* ... */ }, []);

  return (
    <PassosContext.Provider value={{ passos, mensagens, loading, ... }}>
      {children}
    </PassosContext.Provider>
  );
}

export function usePassos() {
  return useContext(PassosContext);
}
```

### Hook: useSincronizacao

```jsx
// hooks/useSincronizacao.js
export function useSincronizacao(etapaId, passoId, ativo = true) {
  const { iniciarPolling, pararPolling } = usePassos();

  useEffect(() => {
    if (!ativo) return;
    iniciarPolling(etapaId, passoId, 5000); // 5s
    return () => pararPolling();
  }, [etapaId, passoId, ativo, iniciarPolling, pararPolling]);
}
```

### Componentes Principais

#### **ModalEtapaDetalhes.jsx**

- Renderiza dois painéis lado a lado:
  - **Esquerda:** Lista de passos da etapa (AbaPassos)
  - **Direita:** Chat do passo selecionado (ChatPasso)
- Ativa polling enquanto modal está aberto

#### **CardPasso.jsx**

- Exibe: título, status, descrição, responsável
- Badge com contagem de mensagens
- Clicável para selecionar e abrir chat

#### **AbaPassos.jsx**

- Grade responsiva de CardPasso
- Mensagem vazia se nenhum passo criado
- Sincroniza automaticamente via polling

#### **ChatPasso.jsx**

- Container principal do chat
- Encadeia ListaMensagens + FormMensagem
- Gerencia submit de novas mensagens

#### **ListaMensagens.jsx**

- Renderiza cada mensagem com:
  - Cabeçalho: nome do usuário, data, "(editada)" se aplicável
  - Corpo: texto da mensagem ou "Mensagem deletada por um administrador"
  - Botão editar (só se é proprietário e não foi deletada)

#### **FormMensagem.jsx**

- Textarea para escrever mensagem
- Botão "Enviar" (desabilitado se vazio ou enviando)
- Feedback visual de carregamento

### State Management

```jsx
// Em App.jsx
import { PassosProvider } from './contexts/PassosContext';

export default function App() {
  return (
    <AuthProvider>
      <PassosProvider>
        <Dashboard />
      </PassosProvider>
    </AuthProvider>
  );
}
```

### Fluxo de Sincronização

1. **Usuário abre modal de etapa** → `carregarPassos(etapaId)`
2. **Usuário clica em passo** → `carregarMensagens(passoId)` + `iniciarPolling()`
3. **A cada 5s:** Polling executa `carregarPassos()` + `carregarMensagens()` novamente
4. **Novo estado vem do servidor** → componentes re-renderizam automaticamente
5. **Modal fecha** → `pararPolling()`

---

## 📝 Fluxo de Implementação

### Fase 1: Backend (Estimado: 2-3 dias)

- [ ] Criar tabelas `Passos` e `MensagensPasso` no banco
- [ ] Criar entidades C# `Passo` e `MensagemPasso`
- [ ] Implementar `PassoRepository` e `MensagemPassoRepository`
- [ ] Implementar `PassoService` e `MensagemPassoService`
- [ ] Implementar `PassosController` e `MensagensPassoController`
- [ ] Testes de API (Postman / xUnit)
- [ ] Deploy em dev

### Fase 2: Frontend (Estimado: 3-4 dias)

- [ ] Criar `PassosContext` com polling
- [ ] Criar hook `useSincronizacao`
- [ ] Componentes: `CardPasso`, `AbaPassos`, `ListaMensagens`, `FormMensagem`
- [ ] Integrar em `ModalEtapaDetalhes`
- [ ] Testes de UI (clique, edição, sincronização)
- [ ] Estilização (CSS) conforme prototipo
- [ ] Deploy em dev

### Fase 3: E2E e Refinamentos (Estimado: 1-2 dias)

- [ ] Testes end-to-end (backend + frontend)
- [ ] Ajustes de UX baseado em feedback
- [ ] Documentação de API (Swagger)
- [ ] Deploy em staging

---

## 🔐 Segurança e Validações

### Backend

- ✅ **Autenticação JWT:** Extrair `UserId` de claims, nunca do body
- ✅ **Autorização:** Admin pode deletar; operadores editam só as suas mensagens
- ✅ **Rate Limiting:** Todas as rotas protegidas com `IaPolicy`
- ✅ **Soft-deletes:** Mensagens/passos deletados não desaparecem do banco, apenas marcados
- ✅ **Validação:** DTO validation via Data Annotations

### Frontend

- ✅ **JWT Storage:** Armazenado em `localStorage`, injetado em cada request
- ✅ **Logout automático:** Interceptador de API em caso de 401
- ✅ **Validação otimista:** Edições locais antes de confirmar no servidor
- ✅ **Sanitização:** Usar `escapeHtml()` para exibir mensagens (evitar XSS)

---

## 📊 Métricas de Sucesso

### Time to Execution ⏱️

- **KPI:** Tempo médio de conclusão de 1 empresa reduz de 12h para 8h
- **Medida:** Registrar timestamp de abertura e fechamento no banco

### Quality ✅

- **KPI:** Retrabalho (passos executados 2+ vezes) reduz em 30%
- **Medida:** Cada atualização de status é registrada; análise via dashboard futuro

### Collaboration 🤝

- **KPI:** Taxa de utilização do chat: >70% das empresas com >1 mensagem
- **Medida:** Contar mensagens por empresa, calcular % com chat ativo

---

## 📌 Assumções

1. **Banco de dados:** SQL Server existente (compatível com migrations EF Core)
2. **Autenticação:** JWT Bearer com claims de `UserId` e `Role` já implementados
3. **Frontend:** React 19 + Vite com Context API disponível
4. **Estrutura existente:** Entidades `Empresa`, `Etapa`, `Usuario` já mapeadas no EF Core
5. **CORS:** Policy `ReactAppPolicy` já configurada no backend
6. **Rate Limiting:** Policy `IaPolicy` já configurada (usar existente)

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Polling sobrecarrega servidor | Médio | Aumentar intervalo para 10s ou implementar WebSocket depois |
| Conflitos de edição simultânea | Baixo | Usar soft-locks ou timestamps (last-write-wins) |
| Histórico cresce indefinidamente | Baixo | Adicionar soft-delete; expurgo depois via job noturno |
| Passos órfãos se etapa for deletada | Médio | Usar cascade delete ou marcar como deletados |

---

## 📞 Referências

- **Prototipo UI:** `c:\contabilize-seguro\prototipo-seguro\prototipo-fluxo-abertura-empresa.html`
- **Backend Guide:** `c:\contabilize-seguro\api-central-cliente\Guia_Arquitetura_API_Csharp_IA.md`
- **Frontend README:** `c:\contabilize-seguro\web-app-cliente\README.md`
- **Backend Rules:** `c:\contabilize-seguro\api-central-cliente\RULES.md`

---

**Documento finalizado em:** 2026-07-15  
**Próximo passo:** Gerar tasks de implementação e começar Fase 1 (Backend)
