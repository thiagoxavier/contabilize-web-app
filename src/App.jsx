import { useState, useEffect } from 'react';
import { Sidebar, Topbar } from './components/sidebar';
import { SenhasPage, Toast } from './components/senhas';
import { ClientesPage } from './components/clientes';
import { TweaksPanel, TweakSection, TweakRadio, TweakColor, useTweaks } from './components/tweaks-panel';
import { LoginScreen } from './components/login';
import { decodeJwt, apiRequest } from './utils/api';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "tabela",
  "accent": ["#13A170", "#0d7050"]
}/*EDITMODE-END*/;

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [toastMsg, setToastMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState(0);
  const [telas, setTelas] = useState([]);
  const [activeTab, setActiveTab] = useState('senhas');

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        const email = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decoded.email;
        const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.unique_name || decoded.name;
        const rolesClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || decoded.roles || [];
        const roles = Array.isArray(rolesClaim) ? rolesClaim : (rolesClaim ? [rolesClaim] : []);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser({
          name: name,
          email: email,
          avatar: name ? name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'US',
          subtitle: roles.join(', ') || 'Central do Cliente',
          roles: roles
        });
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  // Fetch user screens/permissions on login or restore
  useEffect(() => {
    if (!user) return;

    async function loadTelas() {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const decoded = decodeJwt(token);
      const userId = decoded ? (decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.nameid || decoded.sub) : null;
      if (!userId) return;

      try {
        const telasAcessiveis = await apiRequest(`/ControleAcesso/usuarios/${userId}/telas-acessiveis`);
        setTelas(telasAcessiveis);

        if (telasAcessiveis.length > 0) {
          const hasSeguros = telasAcessiveis.some(t => t.codigo === 'geren_seguros');
          const hasUsuarios = telasAcessiveis.some(t => t.codigo === 'geren_usuarios');
          
          if (hasSeguros) {
            setActiveTab('senhas');
          } else if (hasUsuarios) {
            setActiveTab('clientes');
          }
        }
      } catch (err) {
        setToastMsg(err.message || "Erro ao carregar permissões de acesso.");
      }
    }

    loadTelas();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setTelas([]);
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar active={activeTab} counts={{ senhas: counts }} user={user} onLogout={handleLogout} telas={telas} onNavigate={setActiveTab} />
      <main className="main">
        <Topbar crumbs={["Central do cliente", activeTab === 'senhas' ? "Senhas" : "Clientes"]} />
        {activeTab === 'senhas' && (
          <SenhasPage view={t.view} setView={(v)=>setTweak("view", v)} onToast={setToastMsg} onCountChange={setCounts} />
        )}
        {activeTab === 'clientes' && (
          <ClientesPage onToast={setToastMsg} />
        )}
      </main>

      <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visualização">
          <TweakRadio
            label="Layout"
            value={t.view}
            options={[
              { value: "tabela", label: "Tabela" },
              { value: "cards",  label: "Cards"  },
              { value: "lista",  label: "Lista"  },
            ]}
            onChange={v => setTweak("view", v)}
          />
        </TweakSection>
        <TweakSection label="Cor de destaque">
          <TweakColor
            label="Accent"
            value={t.accent}
            options={[
              ["#B89150", "#9B742D"],
              ["#13A170", "#0d7050"],
              ["#3A5867", "#173241"],
            ]}
            onChange={v => setTweak("accent", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
