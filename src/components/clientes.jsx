import { useState, useEffect, useMemo, useRef } from 'react';
import { Icon } from './icons';
import { apiRequest } from '../utils/api';
import { usuariosApi } from '../utils/usuariosApi';
import { ModalGerenciarCamposCustomizados } from './ModalGerenciarCamposCustomizados';
import { EmpresaTabsPanel } from './EmpresaTabsPanel';

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
  const [cofreUser, setCofreUser] = useState(null);
  const [adminCamposModal, setAdminCamposModal] = useState(false);
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
            telefone: data.telefone || null,
            cargo: data.cargo || null,
            mfaHabilitado: data.mfaHabilitado,
            ativo: data.ativo,
            camposCustomizados: data.camposCustomizados || {}
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
            telefone: data.telefone || null,
            cargo: data.cargo || null,
            mfaHabilitado: data.mfaHabilitado,
            camposCustomizados: data.camposCustomizados || {}
          })
        });

        // Assign selected role if any
        if (data.roleId) {
          await apiRequest(`/Usuarios/${newUser.id}/roles/${data.roleId}`, {
            method: 'POST'
          });
        }

        // Upload photo if selected on creation
        if (data.fotoFile) {
          try {
            await usuariosApi.enviarFotoUsuario(newUser.id, data.fotoFile);
          } catch {
            // Toast err handling gracefully
          }
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
          <button className="btn secondary" onClick={() => setAdminCamposModal(true)}>
            <Icon name="sliders" size={15} />
            Gerenciar campos customizados
          </button>
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
                        <button title="Visualizar Cofre" onClick={() => setCofreUser(u)}>
                          <Icon name="lock" size={14} />
                        </button>
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
          onToast={onToast}
        />
      )}

      {tempPasswordModal && (
        <TempPasswordModal 
          name={tempPasswordModal.name} 
          password={tempPasswordModal.password} 
          onClose={() => setTempPasswordModal(null)} 
        />
      )}

      {cofreUser && (
        <CofreClienteModal
          user={cofreUser}
          onClose={() => setCofreUser(null)}
          onToast={onToast}
        />
      )}

      {adminCamposModal && (
        <ModalGerenciarCamposCustomizados
          onClose={() => setAdminCamposModal(false)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

// ============================================================
// MODAL — Add / Edit User
// ============================================================
function UserModal({ mode, data, roles, onClose, onSave, onToast }) {
  const [form, setForm] = useState(data ? {
    ...data,
    telefone: data.telefone || "",
    cargo: data.cargo || "",
    camposCustomizados: data.camposCustomizados || {}
  } : {
    nome: "", email: "", senha: "", telefone: "", cargo: "", roleId: "", mfaHabilitado: false, ativo: true, camposCustomizados: {}
  });

  const [userTab, setUserTab] = useState('dados');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [camposCustomizadosDefs, setCamposCustomizadosDefs] = useState([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(data?.fotoUrl || null);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCustomField = (defId, val) => setForm(f => ({
    ...f,
    camposCustomizados: { ...f.camposCustomizados, [defId]: val }
  }));

  const overlayRef = useRef(null);
  const shouldClose = useRef(false);

  useEffect(() => {
    async function loadDefs() {
      try {
        const defs = await usuariosApi.listarCamposCustomizados();
        setCamposCustomizadosDefs(defs || []);
      } catch (err) {
        onToast?.(err.message || "Erro ao carregar campos customizados.");
      }
    }
    loadDefs();
  }, [onToast]);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      onToast?.("Formato de imagem inválido. Escolha JPG, PNG ou WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      onToast?.("A imagem deve ter no máximo 2MB.");
      return;
    }

    if (mode === 'edit' && form.id) {
      setUploadingFoto(true);
      try {
        const res = await usuariosApi.enviarFotoUsuario(form.id, file);
        const newUrl = res?.fotoUrl || URL.createObjectURL(file);
        setFotoUrl(newUrl);
        set("fotoUrl", newUrl);
        onToast?.("Foto atualizada com sucesso.");
      } catch (err) {
        onToast?.(err.message || "Erro ao enviar foto do usuário.");
      } finally {
        setUploadingFoto(false);
      }
    } else {
      const localUrl = URL.createObjectURL(file);
      setFotoUrl(localUrl);
      set("fotoFile", file);
    }
  };

  const handleRemoveFoto = async () => {
    if (mode === 'edit' && form.id) {
      try {
        await usuariosApi.removerFotoUsuario(form.id);
        setFotoUrl(null);
        set("fotoUrl", null);
        onToast?.("Foto removida com sucesso.");
      } catch (err) {
        onToast?.(err.message || "Erro ao remover foto.");
      }
    } else {
      setFotoUrl(null);
      set("fotoFile", null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || (mode === 'new' && !form.senha)) return;
    onSave(form);
  };

  const currentRoleObj = roles.find(r => r.id === form.roleId || r.nome === form.originalRole);
  const roleNameDisplay = currentRoleObj ? currentRoleObj.nome : (form.originalRole || "Sem Perfil");

  return (
    <div 
      ref={overlayRef}
      className="modal-overlay" 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className="modal" style={{ maxWidth: 850, width: '90vw' }} onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {mode === "edit" ? (
            <div className="modal-head" style={{ borderBottom: '1px solid var(--rule-2)', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--ink-600) 0%, var(--ink-800) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '18px', fontWeight: '700'
                  }}>
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={form.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials(form.nome)
                    )}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                    {roleNameDisplay}
                  </div>
                  <h3 style={{ margin: '2px 0 4px', fontSize: '18px', color: 'var(--ink-900)' }}>{form.nome || 'Editar Usuário'}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
                    <span>{form.email}</span>
                    {form.telefone && <span>• {form.telefone}</span>}
                    {form.cargo && <span>• {form.cargo}</span>}
                  </div>
                </div>

                <div>
                  <span className="tag-cat" style={{
                    background: form.ativo ? 'var(--green-tint)' : 'var(--danger-tint)',
                    color: form.ativo ? 'var(--green-deep)' : 'var(--danger)',
                    borderColor: form.ativo ? 'var(--green-soft)' : 'var(--danger-soft)',
                    fontWeight: 600
                  }}>
                    {form.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <button className="modal-close" type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
                <Icon name="chevDown" size={18} style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>
          ) : (
            <div className="modal-head">
              <div>
                <h3>Novo usuário do portal</h3>
                <div className="sub">Defina o nome, e-mail e nível de permissão (Perfil) do colaborador.</div>
              </div>
              <button className="modal-close" type="button" onClick={onClose}>
                <Icon name="chevDown" size={18} style={{ transform: "rotate(45deg)" }} />
              </button>
            </div>
          )}

          {/* Barra de Abas do Cliente */}
          <div style={{ display: 'flex', gap: 6, padding: '0 24px', borderBottom: '1px solid var(--rule-2)', background: '#FAFAFA' }}>
            {[
              { id: 'dados', label: 'Dados Gerais', icon: 'user' },
              { id: 'anotacoes', label: 'Anotações', icon: 'fileText' },
              { id: 'atividades', label: 'Atividades', icon: 'checkSquare' },
              { id: 'emails', label: 'E-mails', icon: 'mail' },
              { id: 'arquivos', label: 'Arquivos', icon: 'folder' },
              { id: 'documentos', label: 'Documentos', icon: 'shield' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUserTab(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: userTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
                  color: userTab === t.id ? 'var(--ink-900)' : 'var(--muted)',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <Icon name={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {userTab !== 'dados' && (
            <EmpresaTabsPanel 
              empresaId={form.id || 'novo'} 
              empresaNome={form.nome}
              activeTab={userTab}
              hideNav={true}
              onToast={onToast} 
            />
          )}

          <div className="modal-body" style={{ display: userTab === 'dados' ? 'flex' : 'none', maxHeight: '65vh', minHeight: '380px', overflowY: 'auto', gap: 14 }}>
            {/* Foto de perfil */}
            <div className="field-group" style={{ background: 'var(--paper)', padding: '12px 14px', borderRadius: 10 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-900)' }}>Foto de Perfil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg, var(--ink-600) 0%, var(--ink-800) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '14px', fontWeight: '600'
                }}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials(form.nome)
                  )}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/jpeg,image/png,image/webp" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    type="button" 
                    className="btn secondary btn-sm" 
                    disabled={uploadingFoto}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingFoto ? "Enviando..." : "Alterar foto"}
                  </button>
                  {fotoUrl && (
                    <button 
                      type="button" 
                      className="btn ghost btn-sm" 
                      style={{ color: 'var(--danger)' }}
                      onClick={handleRemoveFoto}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field-group">
                <label>Telefone</label>
                <input 
                  value={form.telefone} 
                  onChange={e => set("telefone", e.target.value)} 
                  placeholder="(11) 99999-9999" 
                />
              </div>

              <div className="field-group">
                <label>Cargo / Departamento</label>
                <input 
                  value={form.cargo} 
                  onChange={e => set("cargo", e.target.value)} 
                  placeholder="Ex: Gerente Comercial" 
                />
              </div>
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

            {/* Campos Customizados (Dinâmicos) */}
            {camposCustomizadosDefs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--rule-2)', paddingTop: 12, marginTop: 4 }}>
                <div style={{ font: "600 13px 'Be Vietnam Pro'", color: "var(--ink-900)" }}>Campos adicionais</div>
                {camposCustomizadosDefs.map(def => {
                  const val = form.camposCustomizados?.[def.id] ?? "";
                  return (
                    <div className="field-group" key={def.id}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>
                        {def.nome} {def.obrigatorio && <span style={{ color: 'var(--danger)' }}>*</span>}
                      </label>

                      {def.tipo === 'Texto' && (
                        <input
                          type="text"
                          required={def.obrigatorio}
                          value={val}
                          onChange={e => setCustomField(def.id, e.target.value)}
                        />
                      )}

                      {def.tipo === 'Numero' && (
                        <input
                          type="number"
                          required={def.obrigatorio}
                          value={val}
                          onChange={e => setCustomField(def.id, e.target.value)}
                        />
                      )}

                      {def.tipo === 'Data' && (
                        <input
                          type="date"
                          required={def.obrigatorio}
                          value={val}
                          onChange={e => setCustomField(def.id, e.target.value)}
                        />
                      )}

                      {def.tipo === 'Selecao' && (
                        <select
                          required={def.obrigatorio}
                          value={val}
                          onChange={e => setCustomField(def.id, e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {(def.opcoes || []).map((op, idx) => (
                            <option key={idx} value={op}>{op}</option>
                          ))}
                        </select>
                      )}

                      {def.tipo === 'SimNao' && (
                        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={e => setCustomField(def.id, e.target.checked)}
                            style={{ accentColor: "var(--ink-900)" }}
                          />
                          <span style={{ fontSize: '13px', color: 'var(--ink-900)' }}>Sim</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
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

// ============================================================
// MODAL — View Client Credentials (Cofre)
// ============================================================
function CofreClienteModal({ user, onClose, onToast }) {
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Local state for revealed passwords and values
  const [revealed, setRevealed] = useState({}); // { [credId]: boolean }
  const [decryptedPasswords, setDecryptedPasswords] = useState({}); // { [credId]: string }
  const [copyingId, setCopyingId] = useState(null); // to show checkmark briefly

  const overlayRef = useRef(null);
  const shouldClose = useRef(false);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load user insurer credentials
  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiRequest(`/Usuarios/${user.id}/seguradoras`);
        if (active) setCredentials(data || []);
      } catch (err) {
        if (active) setError(err.message || "Erro ao carregar cofre do usuário.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user.id, refreshCount]);

  const loadCredentials = () => {
    setRefreshCount(c => c + 1);
  };

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

  const handleReveal = async (credId) => {
    // If we are about to reveal and don't have the password, fetch it
    if (!revealed[credId] && !decryptedPasswords[credId]) {
      try {
        const result = await apiRequest(`/Usuarios/${user.id}/seguradoras/${credId}/senha`);
        setDecryptedPasswords(prev => ({ ...prev, [credId]: result.senha }));
      } catch (err) {
        onToast?.(err.message || "Erro ao descriptografar senha.");
        return;
      }
    }
    setRevealed(prev => ({ ...prev, [credId]: !prev[credId] }));
  };

  const handleCopy = async (credId) => {
    try {
      let pwd = decryptedPasswords[credId];
      if (!pwd) {
        const result = await apiRequest(`/Usuarios/${user.id}/seguradoras/${credId}/senha`);
        pwd = result.senha;
        setDecryptedPasswords(prev => ({ ...prev, [credId]: pwd }));
      }
      await navigator.clipboard.writeText(pwd);
      setCopyingId(credId);
      onToast?.("Senha copiada com sucesso!");
      setTimeout(() => setCopyingId(null), 1200);
    } catch (err) {
      onToast?.(err.message || "Erro ao copiar senha.");
    }
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
        style={{ maxWidth: 680 }} 
        onMouseDown={e => e.stopPropagation()} 
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h3>Cofre de Senhas — {user.nome}</h3>
            <div className="sub">Visualização de credenciais de seguradoras cadastradas por este cliente. Todas as leituras são auditadas.</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <Icon name="chevDown" size={18} style={{ transform: "rotate(45deg)" }} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
          {isLoading ? (
            <div className="empty" style={{ padding: '40px 0' }}>
              <div className="spinner" style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h3>Carregando credenciais...</h3>
            </div>
          ) : error ? (
            <div className="empty" style={{ padding: '30px 0' }}>
              <Icon name="alert" size={36} stroke={1.4} style={{ color: 'var(--danger)', marginBottom: 12 }} />
              <h3>Erro ao carregar dados</h3>
              <p>{error}</p>
              <button className="btn secondary btn-sm" onClick={loadCredentials} style={{ marginTop: 12 }}>
                <Icon name="refresh" size={12} /> Tentar novamente
              </button>
            </div>
          ) : credentials.length === 0 ? (
            <div className="empty" style={{ padding: '40px 0' }}>
              <Icon name="lock" size={36} stroke={1.4} style={{ color: 'var(--muted)', marginBottom: 12 }} />
              <h3>Nenhuma senha cadastrada</h3>
              <p>Este cliente ainda não cadastrou nenhuma credencial de seguradora.</p>
            </div>
          ) : (
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--rule-2)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Seguradora</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Categoria</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Usuário</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Senha</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map(c => {
                  const isRevealed = !!revealed[c.id];
                  const plainPassword = decryptedPasswords[c.id];
                  const displayPassword = isRevealed ? (plainPassword || c.senhaMascarada) : (c.senhaMascarada || "••••••••••••");
                  const isCopyOk = copyingId === c.id;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink-900)' }}>{c.nome}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{c.url}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="tag-cat" style={{ color: 'var(--ink-800)', borderColor: 'var(--rule)', background: 'var(--paper)' }}>{c.categoria}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', background: 'var(--paper)', padding: '2px 6px', borderRadius: 4 }}>{c.login}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: '12px' }}>
                          {displayPassword}
                          <button 
                            onClick={() => handleReveal(c.id)} 
                            title={isRevealed ? "Ocultar" : "Revelar"}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--ink-600)' }}
                          >
                            <Icon name={isRevealed ? "eyeOff" : "eye"} size={14} />
                          </button>
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button 
                            className={`btn ghost btn-sm ${isCopyOk ? 'ok' : ''}`}
                            onClick={() => handleCopy(c.id)} 
                            title="Copiar Senha"
                            style={{ 
                              padding: '4px 8px', 
                              color: isCopyOk ? 'var(--green-deep)' : 'var(--ink-700)',
                              background: isCopyOk ? 'var(--green-tint)' : 'transparent',
                              borderColor: isCopyOk ? 'var(--green-soft)' : 'transparent',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Icon name={isCopyOk ? "check" : "copy"} size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-foot">
          <div className="left">
            <Icon name="clock" size={14} /> Acesso de leitura registrado na auditoria
          </div>
          <div className="right">
            <button className="btn primary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

