# F03 - Gerenciar Seguradoras

**Status:** 🔴 Planejado | **Prioridade:** 🔴 CRÍTICA | **Complexidade:** ⭐⭐⭐⭐

## 📋 Descrição

CRUD completo para gerenciar seguradoras, armazenar credenciais criptografadas e categorizar por tipo (Auto, Saúde, Vida, etc).

## 🎯 Objetivos

- ✅ Listar, Criar, Editar, Deletar Seguradoras
- ✅ Criptografar e armazenar credenciais
- ✅ Validar força de senha
- ✅ Suportar MFA por seguradora
- ✅ Auditoria de alterações
- ✅ Busca e filtros

## 📊 Fluxo Principal

```
Usuário ─┬─→ [CRIAR] ─→ Form Seguradora ─→ Encrypt Credenciais ─→ DB
         ├─→ [LISTAR] ─→ Grid Paginado ─→ Filtros por Categoria
         ├─→ [EDITAR] ─→ Decrypt ─→ Atualizar ─→ Encrypt
         └─→ [DELETAR] ─→ Confirmação ─→ Soft Delete
```

## 🔧 Backend Specification

### 1. Models

```csharp
// Models/Entidades/Seguradora.cs
public class Seguradora
{
    public Guid Id { get; set; }
    public string Nome { get; set; }
    public string Url { get; set; }
    public string Color { get; set; } // #FFF format
    public string Categoria { get; set; } // Auto, Saúde, Vida, etc
    public DateTime CriadaEm { get; set; }
    public DateTime AtualizadaEm { get; set; }
    public bool Ativa { get; set; }
}

// Models/Entidades/UsuarioSeguradora.cs
public class UsuarioSeguradora
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public Guid SeguradoraId { get; set; }
    public string Login { get; set; }
    public string SenhaEncriptada { get; set; } // AES-256
    public int Forca { get; set; } // 1-4: Fraca, Media, Forte, Muito Forte
    public bool MfaHabilitado { get; set; }
    public string Obs { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime AtualizadaEm { get; set; }
}

// Models/Dtos/SeguradoraDto.cs
public record SeguradoraDto(
    Guid Id,
    string Nome,
    string Url,
    string Color,
    string Categoria,
    bool Ativa
);

// Models/Dtos/SeguradoraComCredenciaisDto.cs
public record SeguradoraComCredenciaisDto(
    Guid Id,
    string Nome,
    string Url,
    string Color,
    string Categoria,
    string Login,
    int Forca,
    bool MfaHabilitado,
    string Obs,
    DateTime AtualizadaEm
);

// Models/Dtos/CriarSeguradoraDto.cs
public record CriarSeguradoraDto(
    string Nome,
    string Url,
    string Color,
    string Categoria,
    string Login,
    string Senha,
    bool MfaHabilitado,
    string Obs
);
```

### 2. Repository

```csharp
public interface ISeguradoraRepository
{
    Task<List<SeguradoraDto>> ListarPorUsuarioAsync(Guid usuarioId, int skip, int take, string filtro);
    Task<SeguradoraComCredenciaisDto> ObterComCredenciaisAsync(Guid usuarioSeguradoraId, Guid usuarioId);
    Task<UsuarioSeguradora> CriarAsync(Guid usuarioId, Guid seguradoraId, string login, string senhaEncriptada, int forca, bool mfa);
    Task AtualizarAsync(Guid id, string login, string senhaEncriptada, int forca, bool mfa, string obs);
    Task DeletarAsync(Guid id);
    Task<int> ContarPorUsuarioAsync(Guid usuarioId);
}

public class SeguradoraRepository : ISeguradoraRepository
{
    private readonly IDbConnection _connection;

    public async Task<List<SeguradoraDto>> ListarPorUsuarioAsync(Guid usuarioId, int skip, int take, string filtro)
    {
        const string sql = @"
            SELECT DISTINCT
                s.id, s.nome, s.url, s.color, s.categoria, true as ativa
            FROM usuarios_seguradora us
            JOIN seguradoras s ON us.seguradora_id = s.id
            WHERE us.usuario_id = @UsuarioId
              AND (s.nome ILIKE @Filtro OR s.categoria ILIKE @Filtro)
            ORDER BY s.nome
            OFFSET @Skip ROWS
            FETCH NEXT @Take ROWS ONLY";

        return (await _connection.QueryAsync<SeguradoraDto>(sql, new 
        { 
            UsuarioId = usuarioId, 
            Skip = skip, 
            Take = take,
            Filtro = $"%{filtro}%"
        })).ToList();
    }

    public async Task<SeguradoraComCredenciaisDto> ObterComCredenciaisAsync(Guid usuarioSeguradoraId, Guid usuarioId)
    {
        const string sql = @"
            SELECT
                s.id, s.nome, s.url, s.color, s.categoria,
                us.login, us.forca, us.mfa as MfaHabilitado, us.obs, us.atualizada_em
            FROM usuarios_seguradora us
            JOIN seguradoras s ON us.seguradora_id = s.id
            WHERE us.id = @Id AND us.usuario_id = @UsuarioId";

        return await _connection.QueryFirstOrDefaultAsync<SeguradoraComCredenciaisDto>(
            sql, 
            new { Id = usuarioSeguradoraId, UsuarioId = usuarioId }
        );
    }

    public async Task<UsuarioSeguradora> CriarAsync(Guid usuarioId, Guid seguradoraId, string login, string senhaEncriptada, int forca, bool mfa)
    {
        const string sql = @"
            INSERT INTO usuarios_seguradora (usuario_id, seguradora_id, login, senha_encriptada, forca, mfa, criada_em, atualizada_em)
            VALUES (@UsuarioId, @SeguradoraId, @Login, @SenhaEncriptada, @Forca, @Mfa, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, usuario_id, seguradora_id, login, senha_encriptada, forca, mfa, criada_em, atualizada_em";

        return await _connection.QueryFirstOrDefaultAsync<UsuarioSeguradora>(sql, new 
        { 
            UsuarioId = usuarioId,
            SeguradoraId = seguradoraId,
            Login = login,
            SenhaEncriptada = senhaEncriptada,
            Forca = forca,
            Mfa = mfa
        });
    }
}
```

### 3. Service

```csharp
public interface ISeguradoraService
{
    Task<List<SeguradoraDto>> ListarAsync(Guid usuarioId, int page, int pageSize, string filtro);
    Task<SeguradoraComCredenciaisDto> ObterAsync(Guid id, Guid usuarioId);
    Task<UsuarioSeguradora> CriarAsync(Guid usuarioId, CriarSeguradoraDto dto);
    Task AtualizarAsync(Guid id, Guid usuarioId, CriarSeguradoraDto dto);
    Task DeletarAsync(Guid id, Guid usuarioId);
}

public class SeguradoraService : ISeguradoraService
{
    private readonly ISeguradoraRepository _repository;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<SeguradoraService> _logger;

    public async Task<UsuarioSeguradora> CriarAsync(Guid usuarioId, CriarSeguradoraDto dto)
    {
        // Validar força de senha
        var forca = ValidarForcaSenha(dto.Senha);
        
        // Encriptar senha
        var senhaEncriptada = _encryptionService.Encrypt(dto.Senha);

        // Buscar seguradora por nome ou criar
        var seguradora = await ObterOuCriarSeguradora(dto.Nome, dto.Url, dto.Color, dto.Categoria);

        return await _repository.CriarAsync(usuarioId, seguradora.Id, dto.Login, senhaEncriptada, forca, dto.MfaHabilitado);
    }

    private static int ValidarForcaSenha(string senha)
    {
        int score = 0;
        if (senha.Length >= 8) score++;
        if (senha.Length >= 12) score++;
        if (Regex.IsMatch(senha, @"[a-z]") && Regex.IsMatch(senha, @"[A-Z]")) score++;
        if (Regex.IsMatch(senha, @"\d")) score++;
        if (Regex.IsMatch(senha, @"[!@#$%^&*]")) score++;

        return Math.Min(score / 2 + 1, 4); // 1-4
    }
}
```

### 4. Controller

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SeguradorasController : ControllerBase
{
    private readonly ISeguradoraService _service;

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string filtro = "")
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        var seguradoras = await _service.ListarAsync(usuarioId, page, pageSize, filtro);
        return Ok(seguradoras);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obter(Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        var seguradora = await _service.ObterAsync(id, usuarioId);
        if (seguradora is null) return NotFound();
        return Ok(seguradora);
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarSeguradoraDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        var resultado = await _service.CriarAsync(usuarioId, dto);
        return CreatedAtAction(nameof(Obter), new { id = resultado.Id }, resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] CriarSeguradoraDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        await _service.AtualizarAsync(id, usuarioId, dto);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        await _service.DeletarAsync(id, usuarioId);
        return NoContent();
    }
}
```

---

## 🎨 Frontend Specification

### 1. Pages & Components

```typescript
// pages/Seguradoras/SeguradorasPage.tsx
import React, { useState, useEffect } from 'react';
import SeguradorasGrid from '../../components/Seguradoras/SeguradorasGrid';
import SeguradorasForm from '../../components/Seguradoras/SeguradorasForm';
import seguradoraService from '../../services/seguradoraService';
import { Seguradora } from '../../types/seguradoraTypes';

export const SeguradorasPage: React.FC = () => {
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [abrirForm, setAbrirForm] = useState(false);
  const [editando, setEditando] = useState<Seguradora | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarSeguradoras();
  }, []);

  const carregarSeguradoras = async () => {
    try {
      const dados = await seguradoraService.listar();
      setSeguradoras(dados);
    } catch (erro) {
      console.error('Erro ao carregar seguradoras:', erro);
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvar = async (dados: Seguradora) => {
    try {
      if (editando) {
        await seguradoraService.atualizar(editando.id, dados);
      } else {
        await seguradoraService.criar(dados);
      }
      await carregarSeguradoras();
      setAbrirForm(false);
      setEditando(null);
    } catch (erro) {
      console.error('Erro ao salvar:', erro);
    }
  };

  const handleDeletar = async (id: string) => {
    if (confirm('Tem certeza?')) {
      try {
        await seguradoraService.deletar(id);
        await carregarSeguradoras();
      } catch (erro) {
        console.error('Erro ao deletar:', erro);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Seguradoras</h1>
        <button
          onClick={() => {
            setEditando(null);
            setAbrirForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nova Seguradora
        </button>
      </div>

      {abrirForm && (
        <SeguradorasForm
          seguradora={editando}
          onSalvar={handleSalvar}
          onCancelar={() => setAbrirForm(false)}
        />
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <SeguradorasGrid
          seguradoras={seguradoras}
          onEditar={(seg) => {
            setEditando(seg);
            setAbrirForm(true);
          }}
          onDeletar={handleDeletar}
        />
      )}
    </div>
  );
};

// components/Seguradoras/SeguradorasGrid.tsx
import React from 'react';
import { Seguradora } from '../../types/seguradoraTypes';

interface SeguradorasGridProps {
  seguradoras: Seguradora[];
  onEditar: (seguradora: Seguradora) => void;
  onDeletar: (id: string) => void;
}

export const SeguradorasGrid: React.FC<SeguradorasGridProps> = ({
  seguradoras,
  onEditar,
  onDeletar,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {seguradoras.map((seg) => (
        <div key={seg.id} className="bg-white rounded shadow p-4 hover:shadow-lg transition">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded"
              style={{ backgroundColor: seg.color }}
            />
            <div>
              <h3 className="font-bold">{seg.nome}</h3>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{seg.categoria}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4 truncate">{seg.url}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onEditar(seg)}
              className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
            >
              Editar
            </button>
            <button
              onClick={() => onDeletar(seg.id)}
              className="flex-1 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
            >
              Deletar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// components/Seguradoras/SeguradorasForm.tsx
import React, { useState } from 'react';
import { Seguradora } from '../../types/seguradoraTypes';

interface SeguradorasFormProps {
  seguradora?: Seguradora | null;
  onSalvar: (dados: Seguradora) => void;
  onCancelar: () => void;
}

export const SeguradorasForm: React.FC<SeguradorasFormProps> = ({
  seguradora,
  onSalvar,
  onCancelar,
}) => {
  const [formData, setFormData] = useState<Seguradora>(
    seguradora || { id: '', nome: '', url: '', color: '#1F3A8A', categoria: '', login: '', forca: 1, mfaHabilitado: false, obs: '' }
  );

  const [forcaSenha, setForcaSenha] = useState<number>(formData.forca);
  const forcaLabels = ['Fraca', 'Média', 'Forte', 'Muito Forte'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({ ...formData, forca: forcaSenha });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">{seguradora ? 'Editar' : 'Nova'} Seguradora</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Nome da Seguradora"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="url"
          placeholder="URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="color"
          value={formData.color}
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          className="border rounded px-3 py-2 h-10"
        />
        <select
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Selecione categoria</option>
          <option value="Auto">Auto</option>
          <option value="Saúde">Saúde</option>
          <option value="Vida">Vida</option>
          <option value="Multi-ramos">Multi-ramos</option>
          <option value="Patrimonial">Patrimonial</option>
        </select>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Login"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          className="border rounded px-3 py-2 w-full"
          required
        />
      </div>

      <div className="mb-4">
        <input
          type="password"
          placeholder="Senha"
          onChange={(e) => setForcaSenha(calcularForca(e.target.value))}
          className="border rounded px-3 py-2 w-full"
          required
        />
        <p className="text-sm text-gray-600 mt-2">
          Força: <span className="font-bold">{forcaLabels[forcaSenha - 1]}</span>
        </p>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.mfaHabilitado}
            onChange={(e) => setFormData({ ...formData, mfaHabilitado: e.target.checked })}
          />
          MFA Habilitado
        </label>
      </div>

      <div className="mb-4">
        <textarea
          placeholder="Observações"
          value={formData.obs}
          onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
```

### 2. Service e Types

```typescript
// services/seguradoraService.ts
import apiClient from './apiClient';
import { Seguradora } from '../types/seguradoraTypes';

class SeguradoraService {
  async listar(): Promise<Seguradora[]> {
    const { data } = await apiClient.get<Seguradora[]>('/api/seguradoras');
    return data;
  }

  async obter(id: string): Promise<Seguradora> {
    const { data } = await apiClient.get<Seguradora>(`/api/seguradoras/${id}`);
    return data;
  }

  async criar(seguradora: Seguradora): Promise<Seguradora> {
    const { data } = await apiClient.post<Seguradora>('/api/seguradoras', seguradora);
    return data;
  }

  async atualizar(id: string, seguradora: Seguradora): Promise<void> {
    await apiClient.put(`/api/seguradoras/${id}`, seguradora);
  }

  async deletar(id: string): Promise<void> {
    await apiClient.delete(`/api/seguradoras/${id}`);
  }
}

export default new SeguradoraService();

// types/seguradoraTypes.ts
export interface Seguradora {
  id: string;
  nome: string;
  url: string;
  color: string;
  categoria: string;
  login: string;
  forca: number;
  mfaHabilitado: boolean;
  obs: string;
}
```

---

## 🔒 Considerações de Segurança

- ✅ Criptografia AES-256 para senhas
- ✅ Validação de força de senha (1-4 níveis)
- ✅ Auditoria de alterações
- ✅ Máscara de credenciais na listagem
- ✅ Verificação de permissão por usuário

## 📝 Checklist

- [ ] Encryptionervice implementado
- [ ] Repository com Dapper completo
- [ ] CRUD Controller
- [ ] Frontend Grid e Form
- [ ] Validações backend e frontend
- [ ] Testes E2E
- [ ] Documentação Swagger
