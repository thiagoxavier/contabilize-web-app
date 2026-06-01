import { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from './icons';
import { CATEGORIAS } from '../data';
import { apiRequest } from '../utils/api';

// ---------- Utilities ----------
function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff/60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  const days = Math.floor(diff/86400);
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days/30);
  if (months < 12) return `${months} ${months===1?'mês':'meses'} atrás`;
  const years = Math.floor(months/12);
  return `${years} ${years===1?'ano':'anos'} atrás`;
}

function fmtDate(s) {
  const d = new Date(s);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function scorePwd(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

function strengthLabel(score) {
  return ["—", "Fraca", "Razoável", "Boa", "Forte"][score];
}

function genPwd(len = 16) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const b = "abcdefghijkmnpqrstuvwxyz";
  const c = "23456789";
  const d = "!@#$%&*?+=";
  const all = a+b+c+d;
  let p = a[Math.floor(Math.random()*a.length)] + b[Math.floor(Math.random()*b.length)]
        + c[Math.floor(Math.random()*c.length)] + d[Math.floor(Math.random()*d.length)];
  for (let i = 4; i < len; i++) p += all[Math.floor(Math.random()*all.length)];
  return p.split("").sort(() => Math.random()-.5).join("");
}

function initials(name) {
  return name.split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

// ---------- View icon ----------
function ViewIcon({ kind }) {
  const common = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "tabela") return (
    <svg {...common}><rect x="1.5" y="2" width="11" height="10" rx="1.5"/><path d="M1.5 5.5h11M1.5 9h11M5 2v10"/></svg>
  );
  if (kind === "cards") return (
    <svg {...common}><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="7.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="7.5" width="5" height="5" rx="1"/><rect x="7.5" y="7.5" width="5" height="5" rx="1"/></svg>
  );
  return (
    <svg {...common}><rect x="1.5" y="2" width="11" height="2.5" rx="1"/><rect x="1.5" y="6" width="11" height="2.5" rx="1"/><rect x="1.5" y="10" width="11" height="2.5" rx="1"/></svg>
  );
}

// ---------- Avatar ----------
function SegAvatar({ seg, size = 36 }) {
  const ini = initials(seg.nome);
  return (
    <div className="seg-avatar" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${seg.color} 0%, ${shade(seg.color, -22)} 100%)`,
      fontSize: size <= 28 ? 11 : size >= 56 ? 22 : 14,
      borderRadius: size <= 28 ? 7 : 10,
    }}>{ini}</div>
  );
}

function shade(hex, percent) {
  const f = parseInt(hex.slice(1),16), t = percent<0?0:255, p = Math.abs(percent)/100;
  const R = f>>16, G = (f>>8)&0xff, B = f&0xff;
  return "#" + (0x1000000 + (Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B)).toString(16).slice(1);
}

// ---------- Reveal + Copy hook ----------
function useReveal(onToast) {
  const [revealed, setRev] = useState({});
  const [decryptedPasswords, setDecryptedPasswords] = useState({});

  const toggle = async (id, field = "pwd") => {
    const k = id + ":" + field;
    
    // If revealing and we don't have the decrypted password yet, fetch it from API
    if (!revealed[k] && !decryptedPasswords[id]) {
      try {
        const result = await apiRequest(`/usuario-seguradora/${id}/senha`);
        setDecryptedPasswords(prev => ({ ...prev, [id]: result.senha }));
      } catch (err) {
        onToast?.(err.message || "Erro ao descriptografar senha.");
        return;
      }
    }
    setRev(r => ({ ...r, [k]: !r[k] }));
  };

  const is = (id, field = "pwd") => !!revealed[id + ":" + field];
  return { toggle, is, decryptedPasswords, setDecryptedPasswords };
}

// ---------- Toast ----------
export function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check" size={16} />
      {msg}
    </div>
  );
}

// ---------- Category Tag ----------
function CatTag({ cat }) {
  const c = CATEGORIAS.find(x => x.id === cat) || { color: "var(--ink-700)" };
  return (
    <span className="tag-cat" style={{ color: c.color, borderColor: hexAlpha(c.color, 0.3), background: hexAlpha(c.color, 0.06) }}>
      <span className="dot"></span>
      {cat}
    </span>
  );
}

function hexAlpha(hex, a) {
  if (hex.startsWith("var")) return hex;
  const f = parseInt(hex.slice(1),16);
  return `rgba(${f>>16}, ${(f>>8)&0xff}, ${f&0xff}, ${a})`;
}

// ---------- Health bar ----------
function HealthBar({ score }) {
  const colors = ["#D7DEE3", "#C2453A", "#B57814", "#B89150", "#13A170"];
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  return (
    <div className="health-bar">
      <div className="bar"><i style={{ width: widths[score], background: colors[score] }}></i></div>
      <span className="lbl" style={{ color: colors[score] }}>{strengthLabel(score)}</span>
    </div>
  );
}

// ---------- Copy button helper ----------
function CopyBtn({ value, label = "Copiar", className = "", iconOnly = true, onCopied }) {
  const [ok, setOk] = useState(false);
  const handle = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setOk(true);
    onCopied?.(label);
    setTimeout(() => setOk(false), 1200);
  };
  return (
    <button className={className + (ok ? " ok" : "")} onClick={handle} title={label}>
      <Icon name={ok ? "check" : "copy"} size={14} />
      {!iconOnly && <span>{ok ? "Copiado" : label}</span>}
    </button>
  );
}

// ---------- Copy password button helper (audited) ----------
function CopyPasswordBtn({ id, rev, onCopied, className = "copy" }) {
  const [ok, setOk] = useState(false);
  const handle = async (e) => {
    e.stopPropagation();
    try {
      let pwd = rev.decryptedPasswords[id];
      if (!pwd) {
        const result = await apiRequest(`/usuario-seguradora/${id}/senha`);
        pwd = result.senha;
        rev.setDecryptedPasswords(prev => ({ ...prev, [id]: result.senha }));
      }
      await navigator.clipboard?.writeText(pwd);
      setOk(true);
      onCopied?.("Senha copiada");
      setTimeout(() => setOk(false), 1200);
    } catch (err) {
      onCopied?.(err.message || "Erro ao copiar senha.");
    }
  };
  return (
    <button className={className + (ok ? " ok" : "")} onClick={handle} title="Copiar senha">
      <Icon name={ok ? "check" : "copy"} size={14} />
    </button>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export function SenhasPage({ view, setView, onToast, onCountChange }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);  // { mode:'new'|'edit', data? }
  const rev = useReveal(onToast);
  const perPage = view === "cards" ? 12 : view === "list" ? 10 : 12;

  // Track items length changes and propagate to sidebar count
  useEffect(() => {
    if (onCountChange) {
      onCountChange(items.length);
    }
  }, [items, onCountChange]);

  // Fetch credentials on mount
  useEffect(() => {
    async function fetchSeguradoras() {
      try {
        const data = await apiRequest('/usuario-seguradora');
        setItems(data);
      } catch (err) {
        onToast?.(err.message || "Erro ao carregar seguradoras.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSeguradoras();
  }, [onToast]);

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return items.filter(s => {
      if (cat !== "todas" && s.categoria !== cat) return false;
      if (!qn) return true;
      return s.nome.toLowerCase().includes(qn)
        || s.url.toLowerCase().includes(qn)
        || s.login.toLowerCase().includes(qn);
    });
  }, [items, q, cat]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page-1)*perPage, page*perPage);

  // Reset page to 1 when filters or view change (using render phase state adjustment)
  const [prevQ, setPrevQ] = useState(q);
  const [prevCat, setPrevCat] = useState(cat);
  const [prevView, setPrevView] = useState(view);
  if (q !== prevQ || cat !== prevCat || view !== prevView) {
    setPrevQ(q);
    setPrevCat(cat);
    setPrevView(view);
    setPage(1);
  }

  // Stable time on mount to keep stats memo pure
  const [mountTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    const total = items.length;
    const fortes = items.filter(s => s.forca >= 3).length;
    const fracas = items.filter(s => s.forca <= 2).length;
    const mfa = items.filter(s => s.mfa).length;
    const antigas = items.filter(s => {
      const d = (mountTime - new Date(s.atualizadaEm).getTime()) / 86400000;
      return d > 365;
    }).length;
    return { total, fortes, fracas, mfa, antigas };
  }, [items, mountTime]);

  const handleEditClick = async (d) => {
    try {
      let pwd = rev.decryptedPasswords[d.id];
      if (!pwd) {
        const result = await apiRequest(`/usuario-seguradora/${d.id}/senha`);
        pwd = result.senha;
        rev.setDecryptedPasswords(prev => ({ ...prev, [d.id]: pwd }));
      }
      setModal({ mode: "edit", data: { ...d, senha: pwd } });
    } catch (err) {
      onToast(err.message || "Erro ao carregar senha para edição.");
    }
  };

  const handleSave = async (data) => {
    const payload = {
      seguradoraId: data.seguradoraId,
      login: data.login,
      senha: data.senha,
      mfa: data.mfa,
      obs: data.obs || ""
    };

    try {
      // Se não for mock, atualiza a categoria da seguradora no backend primeiro
      if (data.seguradoraId && !String(data.seguradoraId).startsWith('s')) {
        await apiRequest(`/seguradoras/${data.seguradoraId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: data.nome,
            url: data.url,
            color: data.color,
            categoria: data.categoria
          })
        });
      }

      if (data.id && !String(data.id).startsWith('s')) {
        const updated = await apiRequest(`/usuario-seguradora/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        // Atualiza todas as credenciais da mesma seguradora no estado local
        setItems(arr => arr.map(x => {
          if (x.id === data.id) return updated;
          if (x.seguradoraId === data.seguradoraId) return { ...x, categoria: data.categoria };
          return x;
        }));
        onToast("Senha atualizada");
      } else {
        const created = await apiRequest('/usuario-seguradora', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setItems(arr => [created, ...arr].map(x => {
          if (x.seguradoraId === data.seguradoraId) return { ...x, categoria: data.categoria };
          return x;
        }));
        onToast("Senha adicionada");
      }
      setModal(null);
    } catch (err) {
      onToast(err.message || "Erro ao salvar credencial.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta senha? Esta ação não pode ser desfeita.")) return;
    try {
      await apiRequest(`/usuario-seguradora/${id}`, {
        method: 'DELETE',
      });
      setItems(arr => arr.filter(x => x.id !== id));
      onToast("Senha removida");
    } catch (err) {
      onToast(err.message || "Erro ao remover credencial.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Senhas das seguradoras </h1>
          <p className="subtitle">Cofre criptografado de credenciais usadas pela equipe da corretora. Acesso registrado em log de auditoria.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn secondary"><Icon name="download" size={15} /> Exportar</button>
          <button className="btn primary" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" size={15} />
            Nova senha
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label"><Icon name="lock" size={12} className="ico" /> Total de senhas</div>
          <div className="value">{stats.total}</div>
          <div className="desc">{stats.mfa} com 2FA habilitado</div>
        </div>
        <div className="stat">
          <div className="label gold"><Icon name="shieldCheck" size={12} className="ico" /> Saudáveis</div>
          <div className="value" style={{ color: "var(--green-deep)" }}>{stats.fortes}</div>
          <div className="desc">Senha forte ou boa</div>
        </div>
        <div className="stat">
          <div className="label warn"><Icon name="alert" size={12} className="ico" /> Atenção</div>
          <div className="value" style={{ color: "var(--warning)" }}>{stats.fracas}</div>
          <div className="desc">Senhas fracas ou frágeis</div>
        </div>
        <div className="stat">
          <div className="label danger"><Icon name="clock" size={12} className="ico" /> Não rotacionadas</div>
          <div className="value" style={{ color: "var(--danger)" }}>{stats.antigas}</div>
          <div className="desc">Há mais de 12 meses</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={15} />
          <input value={q} onChange={(e)=>setQ(e.target.value)}
            placeholder="Buscar por nome, URL ou usuário…" />
        </div>
        <div className="filter-chips">
          {CATEGORIAS.map(c => (
            <button key={c.id} className={"chip" + (cat === c.id ? " active" : "")}
              onClick={() => setCat(c.id)}>{c.label}</button>
          ))}
        </div>
        <div className="tabs view-tabs">
          {[
            { id: "tabela", label: "Tabela" },
            { id: "cards",  label: "Cards"  },
            { id: "lista",  label: "Lista"  },
          ].map(v => (
            <button key={v.id} className={view === v.id ? "active" : ""}
              onClick={() => setView(v.id)} title={v.label}>
              <ViewIcon kind={v.id} />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="empty">
          <div className="spinner" style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>Carregando credenciais...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <Icon name="search" size={36} stroke={1.4} />
          <h3>Nenhuma seguradora encontrada</h3>
          <p>Tente ajustar a busca ou os filtros de categoria.</p>
        </div>
      ) : (
        <>
          {view === "tabela" && <TableView items={pageItems} rev={rev} onEdit={handleEditClick} onDelete={handleDelete} onCopied={onToast} />}
          {view === "cards"  && <CardsView items={pageItems} rev={rev} onEdit={handleEditClick} onDelete={handleDelete} onCopied={onToast} />}
          {view === "lista"  && <ListView  items={pageItems} rev={rev} onEdit={handleEditClick} onDelete={handleDelete} onCopied={onToast} />}

          {pageCount > 1 && (
            <div className="pagination">
              <div className="info">
                Mostrando <b>{(page-1)*perPage + 1}</b>–<b>{Math.min(page*perPage, filtered.length)}</b> de <b>{filtered.length}</b>
              </div>
              <div className="pages">
                <button onClick={()=>setPage(p => Math.max(1, p-1))} disabled={page===1}><Icon name="chevLeft" size={14} /></button>
                {Array.from({length: pageCount}, (_, i) => (
                  <button key={i} className={page === i+1 ? "active" : ""} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                <button onClick={()=>setPage(p => Math.min(pageCount, p+1))} disabled={page===pageCount}><Icon name="chevRight" size={14} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && <PasswordModal mode={modal.mode} data={modal.data} onClose={()=>setModal(null)} onSave={handleSave} />}
    </div>
  );
}

// ============================================================
// VIEW 1: TABLE
// ============================================================
function TableView({ items, rev, onEdit, onDelete, onCopied }) {
  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Seguradora</th>
            <th>Categoria</th>
            <th>Usuário</th>
            <th>Senha</th>
            <th>Força</th>
            <th>Atualizada</th>
            <th style={{textAlign:"right"}}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td>
                <div className="seg-cell">
                  <SegAvatar seg={s} size={36} />
                  <div>
                    <div className="name">{s.nome} {s.mfa && <span title="2FA habilitado" style={{color:"var(--green-deep)",marginLeft:4}}><Icon name="shieldCheck" size={12} /></span>}</div>
                    <div className="url">{s.url}</div>
                  </div>
                </div>
              </td>
              <td><CatTag cat={s.categoria} /></td>
              <td><span className="user-mono">{s.login}</span></td>
              <td>
                <span className={"pwd" + (rev.is(s.id) ? " revealed" : "")}>
                  {rev.is(s.id) ? (rev.decryptedPasswords[s.id] || s.senhaMascarada) : (s.senhaMascarada || "••••••••••••")}
                  <button onClick={() => rev.toggle(s.id)} title={rev.is(s.id) ? "Ocultar" : "Revelar"}>
                    <Icon name={rev.is(s.id) ? "eyeOff" : "eye"} size={14} />
                  </button>
                </span>
              </td>
              <td><HealthBar score={s.forca} /></td>
              <td>
                <div className="last-update">
                  <span className="when">{fmtDate(s.atualizadaEm)}</span>
                  <span className="ago">{timeAgo(s.atualizadaEm)}</span>
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <CopyBtn value={s.login} label="Copiar usuário" className="copy" onCopied={() => onCopied("Usuário copiado")} />
                  <CopyPasswordBtn id={s.id} rev={rev} onCopied={onCopied} />
                  <button title="Abrir site" onClick={()=>window.open(`https://${s.url}`,"_blank")}><Icon name="external" size={14} /></button>
                  <button title="Editar" onClick={()=>onEdit(s)}><Icon name="edit" size={14} /></button>
                  <button title="Excluir" onClick={()=>onDelete(s.id)}><Icon name="trash" size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// VIEW 2: CARDS
// ============================================================
function CardsView({ items, rev, onEdit, onDelete, onCopied }) {
  return (
    <div className="cards-grid">
      {items.map(s => (
        <div className="pcard" key={s.id}>
          <div className="head">
            <SegAvatar seg={s} size={44} />
            <div className="meta">
              <div className="name">{s.nome}</div>
              <a className="url" href={`https://${s.url}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>
                {s.url} <Icon name="external" size={10} />
              </a>
            </div>
            <CardMenu seg={s} onEdit={onEdit} onDelete={onDelete} />
          </div>

          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <CatTag cat={s.categoria} />
            {s.mfa && (
              <span className="tag-cat" style={{color:"var(--green-deep)",borderColor:"rgba(19,161,112,.3)",background:"rgba(19,161,112,.06)"}}>
                <Icon name="shieldCheck" size={10} /> 2FA
              </span>
            )}
          </div>

          <div className="field">
            <div className="label">Usuário</div>
            <div className="val">
              <span className="text">{s.login}</span>
              <div className="acts">
                <CopyBtn value={s.login} label="Copiar" onCopied={()=>onCopied("Usuário copiado")} />
              </div>
            </div>
          </div>

          <div className="field">
            <div className="label">Senha</div>
            <div className={"val pwd" + (rev.is(s.id) ? " revealed" : "")}>
              <span className="text">
                {rev.is(s.id) ? (rev.decryptedPasswords[s.id] || s.senhaMascarada) : (s.senhaMascarada || "••••••••••••")}
              </span>
              <div className="acts">
                <button onClick={() => rev.toggle(s.id)} title={rev.is(s.id) ? "Ocultar" : "Revelar"}>
                  <Icon name={rev.is(s.id) ? "eyeOff" : "eye"} size={13} />
                </button>
                <CopyPasswordBtn id={s.id} rev={rev} onCopied={onCopied} />
              </div>
            </div>
            <HealthBar score={s.forca} />
          </div>

          <div className="footer">
            <span className="when">Atualizada <b>{timeAgo(s.atualizadaEm)}</b></span>
            <button className="btn ghost btn-sm" onClick={()=>onEdit(s)}><Icon name="edit" size={13} /> Editar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardMenu({ seg, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(()=>document.addEventListener("click", off), 0);
    return () => document.removeEventListener("click", off);
  }, [open]);
  return (
    <div style={{position:"relative"}} ref={ref}>
      <button className="menu-btn" onClick={()=>setOpen(o=>!o)}><Icon name="more" size={16} /></button>
      {open && (
        <div style={{
          position:"absolute",top:"100%",right:0,marginTop:6,background:"#fff",
          border:"1px solid var(--rule)",borderRadius:10,boxShadow:"var(--shadow-md)",
          minWidth:160,zIndex:10,padding:6,display:"flex",flexDirection:"column",gap:2,
        }}>
          <button className="dd-item" onClick={()=>{setOpen(false);onEdit(seg);}}>
            <Icon name="edit" size={13} /> Editar
          </button>
          <button className="dd-item" onClick={()=>{setOpen(false);window.open(`https://${seg.url}`,"_blank");}}>
            <Icon name="external" size={13} /> Abrir site
          </button>
          <div style={{height:1,background:"var(--rule-2)",margin:"4px 0"}} />
          <button className="dd-item danger" onClick={()=>{setOpen(false);onDelete(seg.id);}}>
            <Icon name="trash" size={13} /> Excluir
          </button>
        </div>
      )}
      <style>{`
        .dd-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;
          font:600 12px/1 'Be Vietnam Pro';color:var(--ink-700);text-align:left}
        .dd-item:hover{background:var(--paper)}
        .dd-item.danger{color:var(--danger)}
        .dd-item.danger:hover{background:var(--danger-tint)}
      `}</style>
    </div>
  );
}

// ============================================================
// VIEW 3: LIST (expandable)
// ============================================================
function ListView({ items, rev, onEdit, onDelete, onCopied }) {
  const [openId, setOpenId] = useState(items[0]?.id);

  return (
    <div className="list">
      {items.map(s => {
        const open = openId === s.id;
        return (
          <div className={"litem" + (open ? " open" : "")} key={s.id}>
            <div className="row" onClick={() => setOpenId(open ? null : s.id)}>
              <SegAvatar seg={s} size={40} />
              <div className="meta-col">
                <div className="name">{s.nome}</div>
                <div className="url">{s.url} · <span className="user-mono" style={{fontSize:11}}>{s.login}</span></div>
              </div>
              <CatTag cat={s.categoria} />
              <div className="quick-pwd">
                <Icon name="clock" size={13} /> {timeAgo(s.atualizadaEm)}
              </div>
              <button className="chevron"><Icon name="chevDown" size={16} /></button>
            </div>

            <div className="expand">
              <div>
                <div className="expand-inner">
                  <div className="exp-field">
                    <div className="label">Usuário / login</div>
                    <div className="val">
                      <span className="text">{s.login}</span>
                      <div className="acts">
                        <CopyBtn value={s.login} label="Copiar" onCopied={()=>onCopied("Usuário copiado")} />
                      </div>
                    </div>
                  </div>
                  <div className="exp-field">
                    <div className="label">Senha</div>
                    <div className={"val pwd" + (rev.is(s.id) ? " revealed" : "")}>
                      <span className="text">
                        {rev.is(s.id) ? (rev.decryptedPasswords[s.id] || s.senhaMascarada) : (s.senhaMascarada || "••••••••••••")}
                      </span>
                      <div className="acts">
                        <button onClick={(e) => { e.stopPropagation(); rev.toggle(s.id); }}>
                          <Icon name={rev.is(s.id) ? "eyeOff" : "eye"} size={14} />
                        </button>
                        <CopyPasswordBtn id={s.id} rev={rev} onCopied={onCopied} />
                      </div>
                    </div>
                    <HealthBar score={s.forca} />
                  </div>

                  {s.obs && (
                    <div className="exp-field" style={{gridColumn:"span 2"}}>
                      <div className="label">Observações</div>
                      <div style={{padding:"10px 12px",background:"var(--paper)",border:"1px solid var(--rule-2)",borderRadius:9,
                        font:"500 12px/1.5 'Be Vietnam Pro'",color:"var(--ink-700)"}}>
                        {s.obs}
                      </div>
                    </div>
                  )}

                  <div className="expand-foot">
                    <div className="info">
                      Criada em <b>{fmtDate(s.criadaEm)}</b> · {s.mfa ? <span style={{color:"var(--green-deep)"}}>2FA habilitado</span> : <span style={{color:"var(--warning)"}}>Sem 2FA</span>}
                    </div>
                    <div className="actions">
                      <button className="btn secondary btn-sm" onClick={(e)=>{e.stopPropagation();window.open(`https://${s.url}`,"_blank");}}><Icon name="external" size={13} /> Abrir site</button>
                      <button className="btn secondary btn-sm" onClick={(e)=>{e.stopPropagation();onEdit(s);}}><Icon name="edit" size={13} /> Editar</button>
                      <button className="btn danger btn-sm" onClick={(e)=>{e.stopPropagation();onDelete(s.id);}}><Icon name="trash" size={13} /> Excluir</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MODAL — Add / Edit
// ============================================================
function PasswordModal({ mode, data, onClose, onSave }) {
  const [form, setForm] = useState(data || {
    seguradoraId: "", nome: "", url: "", categoria: "Auto", login: "", senha: "",
    color: "#0B1B26", mfa: false, obs: "",
  });
  const [seguradoras, setSeguradoras] = useState([]);
  const [isLoadingSeguradoras, setIsLoadingSeguradoras] = useState(true);
  const [show, setShow] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const score = scorePwd(form.senha);

  useEffect(() => {
    async function load() {
      try {
        const list = await apiRequest('/seguradoras');
        setSeguradoras(list);
        
        if (mode === 'new' && list.length > 0) {
          const first = list[0];
          setForm(f => ({
            ...f,
            seguradoraId: first.id,
            nome: first.nome,
            url: first.url,
            categoria: first.categoria,
            color: first.color
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar seguradoras", err);
      } finally {
        setIsLoadingSeguradoras(false);
      }
    }
    load();
  }, [mode]);

  const handleSubmit = () => {
    if (!form.seguradoraId || !form.login || !form.senha) return;
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{mode === "edit" ? "Editar senha" : "Nova senha de seguradora"}</h3>
            <div className="sub">As credenciais são criptografadas e armazenadas em cofre. O acesso fica registrado.</div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="chevDown" size={18} style={{transform:"rotate(45deg)"}} /></button>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <div className="field-group" style={{ flex: 1 }}>
              <label>Seguradora</label>
              {isLoadingSeguradoras ? (
                <select disabled style={{ width: '100%' }}><option>Carregando...</option></select>
              ) : (
                <select
                  style={{ width: '100%' }}
                  value={form.seguradoraId || ""}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const found = seguradoras.find(s => s.id === selectedId);
                    if (found) {
                      setForm(f => ({
                        ...f,
                        seguradoraId: selectedId,
                        nome: found.nome,
                        url: found.url,
                        categoria: found.categoria,
                        color: found.color
                      }));
                    }
                  }}
                  disabled={mode === 'edit'}
                >
                  <option value="" disabled>Selecione uma seguradora...</option>
                  {seguradoras.map(s => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="field-group">
              <label>Categoria</label>
              <select
                style={{ width: '100%' }}
                value={form.categoria || ""}
                onChange={e => set("categoria", e.target.value)}
              >
                <option value="" disabled>Selecione...</option>
                {CATEGORIAS.filter(c => c.id !== "todas").map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-group">
            <label>URL do portal (definido pela seguradora)</label>
            <input value={form.url || ""} disabled placeholder="portalcorretor.seguradora.com.br" />
          </div>

          <div className="field-group">
            <label>Usuário / login</label>
            <input value={form.login} onChange={e=>set("login", e.target.value)} placeholder="corretor.silva ou CPF cadastrado" />
          </div>

          <div className="field-group">
            <label style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>Senha</span>
              <button className="btn ghost btn-sm" type="button" onClick={()=>set("senha", genPwd(16))} style={{padding:"4px 8px",fontSize:11}}>
                <Icon name="shuffle" size={12} /> Gerar senha
              </button>
            </label>
            <div className="input-wrap">
              <input
                className="has-eye"
                type={show ? "text" : "password"}
                value={form.senha}
                onChange={e=>set("senha", e.target.value)}
                placeholder="••••••••••••"
              />
              <button type="button" className="reveal" onClick={()=>setShow(s=>!s)}>
                <Icon name={show ? "eyeOff" : "eye"} size={15} />
              </button>
            </div>
            <div className={"strength s" + score}><i/><i/><i/><i/></div>
            <div className={"strength-lbl s" + score}>
              <span>Força: <b>{strengthLabel(score)}</b></span>
              <span>{form.senha.length} caracteres</span>
            </div>
          </div>

          <div className="field-group">
            <label>Observações (opcional)</label>
            <input value={form.obs} onChange={e=>set("obs", e.target.value)} placeholder="Notas internas — ex: usa código SUSEP no segundo passo" />
          </div>

          <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"var(--paper)",borderRadius:10,cursor:"pointer"}}>
            <input type="checkbox" checked={form.mfa} onChange={e=>set("mfa", e.target.checked)} style={{accentColor:"var(--ink-900)"}} />
            <div>
              <div style={{font:"600 13px/1.2 'Be Vietnam Pro'",color:"var(--ink-900)"}}>Esta seguradora usa autenticação em 2 etapas</div>
              <div style={{font:"500 11px/1.3 'Be Vietnam Pro'",color:"var(--muted)",marginTop:2}}>Marcar para destacar no painel</div>
            </div>
          </label>
        </div>

        <div className="modal-foot">
          <div className="left"><Icon name="lock" size={13} /> Criptografada com AES-256</div>
          <div className="right">
            <button className="btn ghost" onClick={onClose}>Cancelar</button>
            <button className="btn primary" onClick={handleSubmit} disabled={!form.seguradoraId || !form.login || !form.senha}>
              <Icon name="check" size={14} /> {mode === "edit" ? "Salvar alterações" : "Salvar senha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
