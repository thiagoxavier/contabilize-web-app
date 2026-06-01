import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './icons';

export function Sidebar({ active = "senhas", counts = {}, user, onLogout, telas = [], onNavigate }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const allItems = [
    { group: "Operação", links: [
      { id: "senhas", label: "Senhas", icon: "key", count: counts.senhas, screenCode: "geren_seguros" },
      { id: "clientes", label: "Clientes", icon: "users", count: counts.clientes, screenCode: "geren_usuarios" },
    ]},
  ];

  // Filter links based on user screens
  const items = allItems.map(sec => {
    const filteredLinks = sec.links.filter(l => {
      if (telas && telas.length > 0) {
        return telas.some(t => t.codigo === l.screenCode);
      }
      // Fallback: show senhas by default while permissions are loading
      return l.id === "senhas";
    });
    return { ...sec, links: filteredLinks };
  }).filter(sec => sec.links.length > 0);

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="logomark">CS</div>
        <div className="brand-text">Contabilize<span>Central do cliente</span></div>
      </div>

      <div className="sb-search">
        <div className="field">
          <Icon name="search" size={15} />
          <input placeholder="Busca em tudo…" />
        </div>
      </div>

      {items.map((sec) => (
        <div className="sb-section" key={sec.group}>
          <div className="label">{sec.group}</div>
          <div className="sb-nav">
            {sec.links.map((l) => (
              <a key={l.id} className={"sb-link" + (active === l.id ? " active" : "")}
                 href="#" onClick={(e) => { e.preventDefault(); onNavigate?.(l.id); }}>
                <Icon name={l.icon} size={18} />
                <span>{l.label}</span>
                {l.count != null && <span className="count">{l.count}</span>}
              </a>
            ))}
          </div>
        </div>
      ))}

      <div className="sb-foot" ref={menuRef} style={{ position: 'relative' }}>
        {showMenu && (
          <div className="sb-user-menu" style={{
            position: 'absolute',
            bottom: 'calc(100% - 10px)',
            left: '16px',
            right: '16px',
            background: 'var(--ink-800)',
            border: '1px solid var(--ink-700)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'panelEnter 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}>
            <button className="sb-menu-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--danger)',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s'
            }} onClick={() => {
              setShowMenu(false);
              if (onLogout) onLogout();
            }}>
              <Icon name="external" size={16} />
              <span>Sair da conta</span>
            </button>
          </div>
        )}
        <div className="sb-user" onClick={() => setShowMenu(!showMenu)}>
          <div className="avatar">{user?.avatar || "MS"}</div>
          <div className="info">
            <div className="name">{user?.name || "Mariana Silva"}</div>
            <div className="sub">{user?.subtitle || "Central do Cliente"}</div>
          </div>
          <Icon name="chevDown" size={16} style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ crumbs = ["Central do cliente", "Senhas"] }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" title="Atualizar"><Icon name="refresh" size={16} /></button>
        <button className="icon-btn" title="Notificações">
          <Icon name="bell" size={16} />
          <span className="dot"></span>
        </button>
        <button className="icon-btn" title="Ajuda"><Icon name="settings" size={16} /></button>
      </div>
    </div>
  );
}
