# F04 - Visualizar Senhas de Clientes - API

**Status:** 🟡 Planejado | **Prioridade:** 🟢 Alta | **Complexidade:** ⭐⭐

## 📋 Descrição

Disponibiliza os endpoints na API necessários para que Administradores possam listar as credenciais cadastradas para cada usuário e descriptografar senhas individuais, mantendo logs de auditoria detalhados de cada acesso.

## 🎯 Objetivos

- Expor endpoint para listar seguradoras vinculadas a um determinado usuário.
- Expor endpoint para obter a senha descriptografada de uma seguradora vinculada a um usuário.
- Restringir o acesso a esses endpoints exclusivamente ao perfil de `Administrador`.
- Registrar auditoria com ID do Administrador e timestamp da leitura da senha em texto claro.

---

## 🔧 Backend Specification

### 1. Controller (`UsuariosController.cs`)

Adicionar os seguintes endpoints:

```csharp
[HttpGet("{id:guid}/seguradoras")]
[Authorize(Roles = "Administrador")]
[ProducesResponseType(typeof(List<UsuarioSeguradoraDto>), StatusCodes.Status200OK)]
public async Task<IActionResult> ListarSeguradoras(Guid id, CancellationToken cancellationToken)
{
    try
    {
        var credenciais = await _usuarioSeguradoraService.ListarAsync(id, cancellationToken);
        return Ok(credenciais);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao listar seguradoras do usuário {UsuarioId}", id);
        return StatusCode(StatusCodes.Status500InternalServerError, new { erro = "Erro ao carregar cofre do usuário." });
    }
}

[HttpGet("{usuarioId:guid}/seguradoras/{credencialId:guid}/senha")]
[Authorize(Roles = "Administrador")]
[ProducesResponseType(typeof(UsuarioSeguradoraSenhaDto), StatusCodes.Status200OK)]
public async Task<IActionResult> ObterSenhaSeguradora(Guid usuarioId, Guid credencialId, CancellationToken cancellationToken)
{
    try
    {
        var senhaDto = await _usuarioSeguradoraService.ObterSenhaAsync(credencialId, usuarioId, cancellationToken);
        if (senhaDto == null) return NotFound(new { erro = "Credencial não encontrada." });

        // Log de auditoria específico indicando o Administrador que realizou a leitura
        var adminId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        _logger.LogInformation(
            "ADMINISTRADOR {AdminId} visualizou a senha da credencial {CredencialId} do usuário {UsuarioId} no timestamp {Timestamp:o}",
            adminId, credencialId, usuarioId, DateTime.UtcNow);

        return Ok(senhaDto);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao obter senha de credencial do usuário {UsuarioId}", usuarioId);
        return StatusCode(StatusCodes.Status500InternalServerError, new { erro = "Erro ao descriptografar senha." });
    }
}
```

---

## 🔒 Considerações de Segurança e Auditoria

- **Restrição de Acesso:** O atributo `[Authorize(Roles = "Administrador")]` garante segurança a nível de perfil.
- **Log de Auditoria:** Imprescindível para conformidade de segurança e rastreabilidade sobre quem leu as senhas.
