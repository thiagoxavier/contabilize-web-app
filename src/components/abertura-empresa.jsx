import { useState, useEffect, useCallback } from 'react';
import { getInitials, avatarColor, statusOf } from '../data/abertura';
import { empresasApi } from '../utils/empresasApi';
import { passosApi } from '../utils/passosApi';
import { pipelinesApi } from '../utils/pipelinesApi';
import { ModalGerenciarPipelines } from './ModalGerenciarPipelines';
import { EmpresaDetalheDrawer } from './EmpresaDetalheDrawer';

function Avatar({ name = 'Responsável', size = 'sm' }) {
  return (
    <span
      className={'ae-avatar' + (size === 'md' ? ' ae-avatar-md' : '')}
      style={{ background: avatarColor(name) }}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

function Tag({ status, label }) {
  return <span className={`ae-tag ae-tag-${status}`}>{label}</span>;
}

function CardEmpresa({ client, onOpen }) {
  const st = statusOf(client.checked || []);

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR');
  };

  const dataInicioStr = formatDate(client.dataInicio);
  const dataFimStr = formatDate(client.dataFim);

  return (
    <button type="button" className="ae-card" onClick={() => onOpen(client.id)}>
      <div className="ae-card-title">{client.name}</div>
      <div className="ae-card-dates">
        {dataInicioStr ? (
          <span className="ae-card-date-badge">
            📅 Início: {dataInicioStr}
          </span>
        ) : (
          <span className="ae-card-date-placeholder">
            📅 Definir data de início
          </span>
        )}
        {dataFimStr && (
          <span className="ae-card-date-badge ae-card-date-success">
            ✅ Concluído: {dataFimStr}
          </span>
        )}
      </div>
      <div className="ae-card-row">
        <Tag status={st.tagStatus} label={st.tagLabel} />
        <Avatar name={client.responsible || 'Sem responsável'} />
      </div>
      <div className="ae-progress">
        <div className="ae-progress-fill" style={{ width: `${st.pct}%` }} />
      </div>
    </button>
  );
}

function Coluna({ col, clients, onOpen }) {
  return (
    <div className="ae-column">
      <div className="ae-column-head">
        <div>
          <div className="ae-column-title">{col.label}</div>
          {col.hint && <div className="ae-column-hint">{col.hint}</div>}
        </div>
        <span className="ae-badge-count">{clients.length}</span>
      </div>
      <div className="ae-cards">
        {clients.map((c) => <CardEmpresa key={c.id} client={c} onOpen={onOpen} />)}
        {clients.length === 0 && <div className="ae-empty-hint">Nenhum cliente nesta etapa</div>}
      </div>
    </div>
  );
}



function ModalNovaEmpresa({ pipelines, onClose, onSave }) {
  const [nome, setNome] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pipelines && pipelines.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || !selectedPipelineId) return;
    setIsSaving(true);
    try {
      await onSave(nome.trim(), selectedPipelineId, dataInicio || null, dataFim || null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="ae-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ae-modal" style={{ maxWidth: '440px' }} role="dialog" aria-modal="true">
        <div className="ae-modal-header">
          <h3>Nova Empresa</h3>
          <button type="button" className="ae-modal-close" aria-label="Fechar" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ae-modal-body" style={{ gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #202124)' }}>
                Nome da Empresa / Cliente *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Padaria Bela Vista Ltda"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #dadce0)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #202124)' }}>
                Fluxo de Trabalho (Pipeline) *
              </label>
              <select
                required
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color, #dadce0)',
                  fontSize: '14px',
                  background: '#fff',
                  outline: 'none',
                }}
              >
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #202124)' }}>
                  Data de Início
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #dadce0)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #202124)' }}>
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #dadce0)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>
          <div className="ae-modal-footer">
            <button type="button" className="ae-btn ae-btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="ae-btn ae-btn-primary" disabled={isSaving || !nome.trim() || !selectedPipelineId}>
              {isSaving ? 'Salvando...' : 'Cadastrar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AberturaEmpresaPage({ user }) {
  const [activeTab, setActiveTab] = useState('abertura');
  const [selectedId, setSelectedId] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [pipelinesRaw, setPipelinesRaw] = useState([]);

  const isAdmin = user?.roles?.some(r => {
    const lower = String(r).toLowerCase();
    return lower === 'admin' || lower === 'administrador';
  }) || user?.subtitle?.toLowerCase().includes('admin');

  // Mapeia pipelines raw para formato esperado pela UI (com labels, colunas, steps)
  const pipelines = pipelinesRaw.map(p => {
    const etapasSorted = [...(p.etapas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    return {
      id: p.id,
      codigo: p.codigo,
      label: p.nome,
      columns: etapasSorted.map(et => ({
        id: et.id,
        label: et.label,
        hint: et.hint,
        steps: [...(et.passos || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(ps => ps.titulo)
      }))
    };
  });

  const pipeline = pipelines.find(p => p.codigo === activeTab) || pipelines[0];

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Carregar pipelines
      const rawPipes = await pipelinesApi.listarPipelines();
      rawPipes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setPipelinesRaw(rawPipes);

      // Mapear pipelines raw locais para tradução correta dos cards das empresas
      const localPipelinesMapped = rawPipes.map(p => {
        const etapasSorted = [...(p.etapas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        return {
          id: p.id,
          codigo: p.codigo,
          label: p.nome,
          columns: etapasSorted.map(et => ({
            id: et.id,
            label: et.label,
            hint: et.hint,
            steps: [...(et.passos || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(ps => ps.titulo)
          }))
        };
      });

      // 2. Carregar empresas
      const empresas = await empresasApi.listarEmpresas();

      // Mapear cada empresa com suas etapas e passos do backend
      const loadedClients = await Promise.all(
        empresas.map(async (emp) => {
          let etapas;
          try {
            etapas = await empresasApi.listarEtapas(emp.id);
          } catch {
            etapas = [];
          }

          // Encontra o pipeline da empresa
          const p = localPipelinesMapped.find(x => x.id === emp.pipelineId) || localPipelinesMapped[0];
          const cols = p ? p.columns : [];

          let activeColId = cols.length > 0 ? cols[0].id : '';
          let currentPassos = [];

          if (p && cols.length > 0 && etapas.length > 0) {
            // Ordenar etapas por ordem
            etapas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

            // Encontra etapa em andamento (status !== 2)
            const activeEtapa = etapas.find(e => e.status !== 2) || etapas[etapas.length - 1];

            // Mapeia label da etapa para col.id se bater, senão usa label formatado
            const matchedCol = cols.find(c => c.label.toLowerCase() === activeEtapa.label.toLowerCase());
            activeColId = matchedCol ? matchedCol.id : cols[0].id;

            // Carrega passos da etapa ativa
            try {
              currentPassos = await passosApi.listarPorEtapa(activeEtapa.id);
            } catch {
              currentPassos = [];
            }
          }

          const checked = currentPassos.length > 0
            ? currentPassos.map(ps => ps.status === 2)
            : (cols.find(c => c.id === activeColId)?.steps.map(() => false) || []);

          return {
            id: emp.id,
            pipelineId: p ? p.id : null,
            pipelineCode: p ? p.codigo : 'abertura',
            name: emp.nome,
            dataInicio: emp.dataInicio,
            dataFim: emp.dataFim,
            responsible: 'Equipe Contabilize',
            columnId: activeColId,
            etapas: etapas,
            currentPassos: currentPassos,
            checked: checked,
          };
        })
      );

      setClients(loadedClients);
      
      // Ajustar tab ativo se o tab anterior não existe mais
      if (rawPipes.length > 0) {
        setActiveTab(prev => {
          const exists = rawPipes.some(p => p.codigo === prev);
          return exists ? prev : rawPipes[0].codigo;
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function selectPipeline(id) {
    setActiveTab(id);
    setSelectedId(null);
  }

  async function toggleStep(clientId, stepIndex) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newChecked = [...client.checked];
    newChecked[stepIndex] = !newChecked[stepIndex];

    // Sincroniza alteração no estado local
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, checked: newChecked } : c)));

    // Se houver passos do backend correspondentes, sincroniza
    if (client.currentPassos && client.currentPassos[stepIndex]) {
      const passo = client.currentPassos[stepIndex];
      const newStatus = newChecked[stepIndex] ? 2 : 0;
      try {
        await passosApi.atualizarPasso(passo.id, {
          titulo: passo.titulo,
          descricao: passo.descricao,
          status: newStatus,
          responsavelId: passo.responsavelId,
        });
      } catch (err) {
        console.error('Erro ao atualizar passo no backend:', err);
      }
    }
  }

  async function moveCard(clientId, dir) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const p = pipelines.find(x => x.id === client.pipelineId) || pipelines[0];
    if (!p) return;
    const cols = p.columns;
    const idx = cols.findIndex((col) => col.id === client.columnId);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= cols.length) return;
    const nextCol = cols[nextIdx];

    // Atualiza localmente
    setClients((prev) => prev.map((c) => {
      if (c.id !== clientId) return c;
      return { ...c, columnId: nextCol.id, checked: nextCol.steps.map(() => false) };
    }));
    setSelectedId(null);

    // Se houver etapa no backend, atualiza o status
    if (client.etapas && client.etapas.length > 0) {
      try {
        if (dir > 0) {
          const currentEtapa = client.etapas[idx];
          if (currentEtapa) {
            await empresasApi.atualizarEtapa(currentEtapa.id, {
              label: currentEtapa.label,
              status: 2, // Concluído
            });
          }
          const nextEtapa = client.etapas[nextIdx];
          if (nextEtapa && nextEtapa.status === 0) {
            await empresasApi.atualizarEtapa(nextEtapa.id, {
              label: nextEtapa.label,
              status: 1, // Em andamento
            });
          }
        } else {
          const prevEtapa = client.etapas[nextIdx];
          if (prevEtapa) {
            await empresasApi.atualizarEtapa(prevEtapa.id, {
              label: prevEtapa.label,
              status: 1, // Em andamento
            });
          }
          const currentEtapa = client.etapas[idx];
          if (currentEtapa) {
            await empresasApi.atualizarEtapa(currentEtapa.id, {
              label: currentEtapa.label,
              status: 0, // Não iniciado
            });
          }
        }
      } catch (err) {
        console.error('Erro ao mover etapa no backend:', err);
      }
    }

    await loadData();
  }

  async function handleCreateEmpresa(nome, pipelineId, dataInicio, dataFim) {
    try {
      await empresasApi.criarEmpresa({ nome, pipelineId, dataInicio, dataFim });
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar empresa.');
    }
  }

  const selected = selectedId != null ? clients.find((c) => c.id === selectedId) : null;
  const activePipeline = pipeline;

  return (
    <div className="ae-page">
      <div className="ae-tabs" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {pipelines.map((p) => (
            <button
              key={p.id}
              type="button"
              className={'ae-tab' + (p.codigo === activeTab ? ' ae-tab-active' : '')}
              onClick={() => selectPipeline(p.codigo)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <button
              type="button"
              className="ae-btn ae-btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowManageModal(true)}
              title="Gerenciar Pipelines"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Gerenciar Pipelines
            </button>
          )}
          <button
            type="button"
            className="ae-btn ae-btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowNewModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova Empresa
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fde8e8', color: '#c53030', borderRadius: '6px', margin: '16px 0', fontSize: '14px' }}>
          {errorMsg}
        </div>
      )}

      {loading && pipelines.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #5f6368)' }}>
          Carregando fluxos de trabalho do servidor...
        </div>
      ) : (
        <div className="ae-board-wrap">
          <div className="ae-board">
            {activePipeline ? (
              activePipeline.columns.map((col) => (
                <Coluna
                  key={col.id}
                  col={col}
                  clients={clients.filter((c) => c.pipelineId === activePipeline.id && c.columnId === col.id)}
                  onOpen={setSelectedId}
                />
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #5f6368)', width: '100%' }}>
                Nenhum pipeline configurado. Use o botão "Gerenciar Pipelines" para criar um.
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <EmpresaDetalheDrawer
          empresa={selected}
          user={user}
          isAdmin={isAdmin}
          pipeline={pipelines.find((p) => p.id === selected.pipelineId)}
          onToggleStep={toggleStep}
          onMove={moveCard}
          onClose={() => setSelectedId(null)}
          onUpdate={loadData}
        />
      )}

      {showNewModal && (
        <ModalNovaEmpresa
          pipelines={pipelines}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateEmpresa}
        />
      )}

      {showManageModal && (
        <ModalGerenciarPipelines
          onClose={() => setShowManageModal(false)}
          onSaveSuccess={loadData}
        />
      )}
    </div>
  );
}
