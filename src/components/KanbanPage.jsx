import { useEffect, useState } from 'react';
import { Icon } from './icons';
import { empresasApi } from '../utils/empresasApi';
import { KanbanProvider, useKanban } from '../contexts/KanbanContext';
import { FilterBar } from './FilterBar';
import { KanbanBoard } from './KanbanBoard';
import { PassoModal } from './PassoModal';

// Regra de negócio (RULES.md / PRD-KANBAN §1.3/§4.4): Etapas têm CRUD completo
// para Administrador/Gerente e são somente-leitura para os demais perfis
// (persona "Corretor" do PRD — hoje mapeada para a role `Operador`, ver nota
// de desvio em docs/contexto/CONTRATO-API.md). Calculado a partir das mesmas
// roles do JWT que App.jsx/Sidebar já usam para o gate de "admin".
function calcularPodeGerenciarEtapas(user) {
  return Boolean(
    user?.roles?.some((r) => {
      const lower = String(r).toLowerCase();
      return lower === 'admin' || lower === 'administrador' || lower === 'gerente';
    })
  );
}

/**
 * Fica dentro do <KanbanProvider/> (precisa de useKanban) — dispara o
 * carregamento inicial de etapas/passos da empresa escolhida e monta o board
 * propriamente dito (FilterBar + KanbanBoard + PassoModal), que já foram
 * aprovados em rodadas anteriores.
 */
function KanbanBoardSection({ podeGerenciarEtapas, onToast }) {
  const { fetchEtapas, fetchPassos } = useKanban();
  const [passoSelecionado, setPassoSelecionado] = useState(null);

  useEffect(() => {
    fetchEtapas().catch(() => {
      // erro já fica exposto em `erro` (contexto) e renderizado no banner do KanbanBoard
    });
    fetchPassos().catch(() => {
      // erro já fica exposto em `erro` (contexto) e renderizado no banner do KanbanBoard
    });
  }, [fetchEtapas, fetchPassos]);

  return (
    <>
      <FilterBar />
      <KanbanBoard podeGerenciarEtapas={podeGerenciarEtapas} onClickPasso={setPassoSelecionado} />
      {passoSelecionado && (
        <PassoModal
          passo={passoSelecionado}
          onClose={() => setPassoSelecionado(null)}
          onToast={onToast}
          onSalvo={() => setPassoSelecionado(null)}
          onDeletado={() => setPassoSelecionado(null)}
        />
      )}
    </>
  );
}

/**
 * KanbanPage — tela "Kanban" do portal (PRD-KANBAN §5.1).
 *
 * Cada Empresa tem seu próprio board de Etapas/Passos (ver nota de desvio do
 * PRD em docs/contexto/CONTRATO-API.md: "pipelineId" do <KanbanProvider/> é o
 * EmpresaId). Esta página só escolhe a Empresa e delega tudo mais para os
 * componentes já aprovados (<KanbanProvider/>, <FilterBar/>, <KanbanBoard/>,
 * <PassoModal/>).
 */
export function KanbanPage({ user, onToast }) {
  const [empresas, setEmpresas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState('');

  useEffect(() => {
    let ativo = true;
    async function loadEmpresas() {
      setIsLoading(true);
      try {
        const data = await empresasApi.listarEmpresas();
        if (ativo) setEmpresas(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ativo) onToast?.(err.message || 'Erro ao carregar empresas.');
      } finally {
        if (ativo) setIsLoading(false);
      }
    }
    loadEmpresas();
    return () => {
      ativo = false;
    };
  }, [onToast]);

  const podeGerenciarEtapas = calcularPodeGerenciarEtapas(user);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Kanban</h1>
          <p className="subtitle">Acompanhe o fluxo de etapas e passos do processo de cada Empresa.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field-group" style={{ minWidth: 280 }}>
          <label htmlFor="kb-page-empresa">Empresa</label>
          <select
            id="kb-page-empresa"
            value={empresaId}
            disabled={isLoading || empresas.length === 0}
            onChange={(e) => setEmpresaId(e.target.value)}
          >
            <option value="">Selecione uma empresa…</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="empty">
          <div className="spinner" style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--brand-primary)', borderRadius: '50%', width: 24, height: 24, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h3>Carregando empresas...</h3>
        </div>
      ) : empresas.length === 0 ? (
        <div className="empty">
          <Icon name="file" size={36} stroke={1.4} />
          <h3>Nenhuma empresa cadastrada</h3>
          <p>Cadastre uma empresa para começar a usar o Kanban.</p>
        </div>
      ) : !empresaId ? (
        <div className="empty">
          <Icon name="shuffle" size={36} stroke={1.4} />
          <h3>Selecione uma empresa</h3>
          <p>Escolha uma empresa acima para visualizar o board de etapas e passos.</p>
        </div>
      ) : (
        <KanbanProvider key={empresaId} pipelineId={empresaId}>
          <KanbanBoardSection podeGerenciarEtapas={podeGerenciarEtapas} onToast={onToast} />
        </KanbanProvider>
      )}
    </div>
  );
}
