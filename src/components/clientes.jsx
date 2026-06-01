import { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './icons';
import { apiRequest } from '../utils/api';

// ---------- Utilities ----------
function initials(name) {
  if (!name) return 'US';
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtDate(s) {
  if (!s) return 'Nunca';
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function genPwd(len = 12) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const b = "abcdefghijkmnpqrstuvwxyz";
  const c = "23456789";
  const d = "!@#$%&*?+=";
  const all = a + b + c + d;
  let p = a[Math.floor(Math.random() * a.length)] + b[Math.floor(Math.random() * b.length)]
        + c[Math.floor(Math.random() * c.length)] + d[Math.floor(Math.random() * d.length)];
  for (let i = 4; i < len; i++) p += all[Math.floor(Math.random() * all.length)];
  return p.split("").sort(() => Math.random() - .5).join("");
}

export function ClientesPage({ onToast }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: 'new'|'edit', data? }
  const [tempPasswordModal, setTempPasswordModal] = useState(null); // { name, password }
  const perPage = 10;

  const loadStarted = useRef(false);

  // Load users and roles on mount
  useEffect(() => {
    if (loadStarted.current) return;
    loadStarted.current = true;

    async function loadData() {
      try {
        const [usersData, rolesData] = await Promise.all([
          apiRequest('/Usuarios?pageSize=100'),
          apiRequest('/ControleAcesso/roles')
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        onToast?.(err.message || "Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [onToast]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    if (!qn) return users;
    return users.filter(u => 
      u.nome.toLowerCase().includes(qn) || 
      u.email.toLowerCase().includes(qn)
    );
  }, [users, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page to 1 when search query changes (using render phase state adjustment)
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setPage(1);
  }

  const handleSave = async (data) => {
    try {
      if (modal.mode === 'edit') {
        // 1. Update user basic details
        await apiRequest(`/Usuarios/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            mfaHabilitado: data.mfaHabilitado,
            ativo: data.ativo
          })
        });

        // 2. Handle role updates if changed
        const currentRoleName = data.originalRole;
        const currentRole = roles.find(r => r.nome === currentRoleName);
        const newRoleId = data.roleId;

        if (newRoleId && (!currentRole || currentRole.id !== newRoleId)) {
          // If there was an old role, remove it first
          if (currentRole) {
            await apiRequest(`/Usuarios/${data.id}/roles/${currentRole.id}`, {
              method: 'DELETE'
            });
          }
          // Assign new role
          await apiRequest(`/Usuarios/${data.id}/roles/${newRoleId}`, {
            method: 'POST'
          });
        } else if (!newRoleId && currentRole) {
          // No role selected but had one before, remove it
          await apiRequest(`/Usuarios/${data.id}/roles/${currentRole.id}`, {
            method: 'DELETE'
          });
        }

        onToast("Usuário atualizado com sucesso");
      } else {
        // Create user
        const newUser = await apiRequest('/Usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            senha: data.senha,
            mfaHabilitado: data.mfaHabilitado
          })
        });

        // Assign selected role if any
        if (data.roleId) {
          await apiRequest(`/Usuarios/${newUser.id}/roles/${data.roleId}`, {
            method: 'POST'
          });
        }

        onToast("Usuário criado com sucesso");
      }

      // Refresh users list
      const updatedUsers = await apiRequest('/Usuarios?pageSize=100');
      setUsers(updatedUsers);
      setModal(null);
    } catch (err) {
      onToast(err.message || "Erro ao salvar usuário.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este usuário? Ele perderá todo o acesso ao painel.")) return;
    try {
      await apiRequest(`/Usuarios/${id}`, {
        method: 'DELETE'
      });
      onToast("Usuário excluído com sucesso");
      const updatedUsers = await apiRequest('/Usuarios?pageSize=100');
      setUsers(updatedUsers);
    } catch (err) {
      onToast(err.message || "Erro ao excluir usuário.");
    }
  };

  const handleResetPassword = async (user) => {
    if (!confirm(`Resetar a senha de ${user.nome}? Uma nova senha temporária será gerada.`)) return;
    try {
      const response = await apiRequest(`/Usuarios/${user.id}/reset-senha`, {
        method: 'POST'
      });
      setTempPasswordModal({
        name: user.nome,
        password: response.senhaTemporaria
      });
    } catch (err) {
      onToast(err.message || "Erro ao resetar senha.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestão de Acesso (Clientes)</h1>
          <p className="subtitle">Gerencie as contas de acesso da corretora, perfis de segurança e autenticação em duas etapas (MFA).</p>
        </div>
        <div className="page-header-actions">
          <button className="btn primary" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" size={15} />
            Novo usuário
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={15} />
          <input 
            value={q} 
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou e-mail…" 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="empty">
          <div className="spinner" style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>Carregando usuários...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Icon name="users" size={36} stroke={1.4} />
          <h3>Nenhum usuário encontrado</h3>
          <p>Tente ajustar o termo da sua busca.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Perfil de Acesso</th>
                  <th>MFA</th>
                  <th>Status</th>
                  <th>Último Acesso</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="seg-cell">
                        <div className="seg-avatar" style={{
                          background: 'linear-gradient(135deg, var(--ink-600) 0%, var(--ink-800) 100%)',
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '600'
                        }}>
                          {initials(u.nome)}
                        </div>
                        <div>
                          <div className="name" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{u.nome}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map(r => (
                          <span key={r} className="tag-cat" style={{ color: 'var(--gold-deep)', borderColor: 'var(--gold-soft)', background: 'var(--gold-tint)', marginRight: 4 }}>
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="tag-cat" style={{ color: 'var(--muted)', borderColor: 'var(--rule)', background: 'var(--paper)' }}>
                          Sem Perfil
                        </span>
                      )}
                    </td>
                    <td>
                      {u.mfaHabilitado ? (
                        <span style={{ color: 'var(--green-deep)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <Icon name="shieldCheck" size={14} /> Ativo
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Desativado
                        </span>
                      )}
                    </td>
                    <td>
                      {u.ativo ? (
                        <span className="tag-cat" style={{ color: 'var(--green-deep)', borderColor: 'rgba(19,161,112,.3)', background: 'rgba(19,161,112,.06)' }}>
                          <span className="dot"></span>Ativo
                        </span>
                      ) : (
                        <span className="tag-cat" style={{ color: 'var(--danger)', borderColor: 'rgba(194,69,58,.3)', background: 'rgba(194,69,58,.06)' }}>
                          <span className="dot"></span>Inativo
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="last-update">
                        <span className="when">{fmtDate(u.ultimoAcesso)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button title="Resetar Senha" onClick={() => handleResetPassword(u)}>
                          <Icon name="key" size={14} />
                        </button>
                        <button title="Editar" onClick={() => {
                          const userRoleName = u.roles && u.roles[0];
                          const roleObj = roles.find(r => r.nome === userRoleName);
                          setModal({
                            mode: "edit",
                            data: {
                              ...u,
                              originalRole: userRoleName,
                              roleId: roleObj ? roleObj.id : ''
                            }
                          });
                        }}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button title="Excluir" onClick={() => handleDelete(u.id)}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="pagination">
              <div className="info">
                Mostrando <b>{(page - 1) * perPage + 1}</b>–<b>{Math.min(page * perPage, filtered.length)}</b> de <b>{filtered.length}</b>
              </div>
              <div className="pages">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <Icon name="chevLeft" size={14} />
                </button>
                {Array.from({ length: pageCount }, (_, i) => (
                  <button 
                    key={i} 
                    className={page === i + 1 ? "active" : ""} 
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}>
                  <Icon name="chevRight" size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <UserModal 
          mode={modal.mode} 
          data={modal.data} 
          roles={roles}
          onClose={() => setModal(null)} 
          onSave={handleSave} 
        />
      )}

      {tempPasswordModal && (
        <TempPasswordModal 
          name={tempPasswordModal.name} 
          password={tempPasswordModal.password} 
          onClose={() => setTempPasswordModal(null)} 
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL — Add / Edit User
// ============================================================
function UserModal({ mode, data, roles, onClose, onSave }) {
  const [form, setForm] = useState(data || {
    nome: "", email: "", senha: "", roleId: "", mfaHabilitado: false, ativo: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const overlayRef = useRef(null);
  const shouldClose = useRef(false);

  const handleMouseDown = (e) => {
    if (e.target === overlayRef.current) {
      shouldClose.current = true;
    } else {
      shouldClose.current = false;
    }
  };

  const handleMouseUp = (e) => {
    if (shouldClose.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleCopyPassword = () => {
    if (!form.senha) return;
    navigator.clipboard.writeText(form.senha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || (mode === 'new' && !form.senha)) return;
    onSave(form);
  };

  return (
    <div 
      ref={overlayRef}
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="modal" onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-head">
            <div>
              <h3>{mode === "edit" ? "Editar usuário" : "Novo usuário do portal"}</h3>
              <div className="sub">Defina o nome, e-mail e nível de permissão (Perfil) do colaborador.</div>
            </div>
            <button className="modal-close" type="button" onClick={onClose}>
              <Icon name="chevDown" size={18} style={{ transform: "rotate(45deg)" }} />
            </button>
          </div>

          <div className="modal-body">
            <div className="field-group">
              <label>Nome Completo</label>
              <input 
                required
                value={form.nome} 
                onChange={e => set("nome", e.target.value)} 
                placeholder="Ex: Mariana Silva" 
                autoFocus 
              />
            </div>

            <div className="field-group">
              <label>E-mail Corporativo</label>
              <input 
                required
                type="email"
                value={form.email} 
                onChange={e => set("email", e.target.value)} 
                placeholder="mariana@suacorretora.com.br" 
              />
            </div>

            {mode === 'new' && (
              <div className="field-group">
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Senha Temporária</span>
                  <button 
                    className="btn ghost btn-sm" 
                    type="button" 
                    onClick={() => {
                      set("senha", genPwd(12));
                      setCopied(false);
                    }} 
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    <Icon name="shuffle" size={12} /> Gerar senha
                  </button>
                </label>
                <div className="input-wrap">
                  <input
                    required
                    className="has-eye"
                    type={showPassword ? "text" : "password"}
                    value={form.senha}
                    onChange={e => {
                      set("senha", e.target.value);
                      setCopied(false);
                    }}
                    placeholder="••••••••••••"
                    style={{ paddingRight: 72 }}
                  />
                  <button 
                    type="button" 
                    className="reveal" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ right: 38 }}
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <Icon name={showPassword ? "eyeOff" : "eye"} size={15} />
                  </button>
                  <button 
                    type="button" 
                    className="reveal" 
                    onClick={handleCopyPassword}
                    style={{ right: 8 }}
                    title="Copiar senha"
                    disabled={!form.senha}
                  >
                    <Icon name={copied ? "check" : "copy"} size={15} style={{ color: copied ? 'var(--green-deep)' : 'inherit' }} />
                  </button>
                </div>
              </div>
            )}

            <div className="field-group">
              <label>Perfil de Acesso (Cargo)</label>
              <select 
                value={form.roleId} 
                onChange={e => set("roleId", e.target.value)}
              >
                <option value="">Selecione um perfil...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nome} ({r.descricao || 'Sem descrição'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--paper)", borderRadius: 10, cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={form.mfaHabilitado} 
                  onChange={e => set("mfaHabilitado", e.target.checked)} 
                  style={{ accentColor: "var(--ink-900)" }} 
                />
                <div>
                  <div style={{ font: "600 13px/1.2 'Be Vietnam Pro'", color: "var(--ink-900)" }}>Exigir autenticação em duas etapas (MFA)</div>
                  <div style={{ font: "500 11px/1.3 'Be Vietnam Pro'", color: "var(--muted)", marginTop: 2 }}>Mais segurança no acesso deste usuário</div>
                </div>
              </label>

              {mode === 'edit' && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--paper)", borderRadius: 10, cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={form.ativo} 
                    onChange={e => set("ativo", e.target.checked)} 
                    style={{ accentColor: "var(--ink-900)" }} 
                  />
                  <div>
                    <div style={{ font: "600 13px/1.2 'Be Vietnam Pro'", color: "var(--ink-900)" }}>Usuário Ativo</div>
                    <div style={{ font: "500 11px/1.3 'Be Vietnam Pro'", color: "var(--muted)", marginTop: 2 }}>Desmarque para suspender temporariamente o acesso do usuário</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="modal-foot">
            <div className="left"></div>
            <div className="right">
              <button className="btn ghost" type="button" onClick={onClose}>Cancelar</button>
              <button 
                className="btn primary" 
                type="submit" 
                disabled={!form.nome || !form.email || (mode === 'new' && !form.senha)}
              >
                <Icon name="check" size={14} /> {mode === "edit" ? "Salvar alterações" : "Criar usuário"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL — Temporary Password Display
// ============================================================
function TempPasswordModal({ name, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef(null);
  const shouldClose = useRef(false);

  const handleMouseDown = (e) => {
    if (e.target === overlayRef.current) {
      shouldClose.current = true;
    } else {
      shouldClose.current = false;
    }
  };

  const handleMouseUp = (e) => {
    if (shouldClose.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      ref={overlayRef}
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div 
        className="modal" 
        style={{ maxWidth: 440 }} 
        onMouseDown={e => e.stopPropagation()} 
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3 style={{ color: 'var(--ink-900)' }}>Senha Temporária Gerada</h3>
            <div className="sub">Senha resetada com sucesso para <b>{name}</b>.</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="chevDown" size={18} style={{ transform: "rotate(45deg)" }} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>
          <div style={{ font: "500 13px/1.5 'Be Vietnam Pro'", color: 'var(--muted)' }}>
            Copie a senha abaixo e envie para o usuário. Por motivos de segurança, esta senha não será exibida novamente.
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--paper)', border: '1px dashed var(--gold)', borderRadius: 10,
            padding: '12px 16px', font: "700 16px 'JetBrains Mono', monospace", color: 'var(--ink-900)'
          }}>
            <span>{password}</span>
            <button 
              className={`btn ghost btn-sm ${copied ? 'ok' : ''}`} 
              onClick={handleCopy} 
              style={{ color: copied ? 'var(--green-deep)' : 'var(--ink-700)', display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <Icon name={copied ? "check" : "copy"} size={14} />
              <span>{copied ? "Copiado!" : "Copiar"}</span>
            </button>
          </div>
        </div>

        <div className="modal-foot">
          <div className="left"></div>
          <div className="right">
            <button className="btn primary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
