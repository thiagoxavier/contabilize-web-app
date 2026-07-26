import { useState, useEffect } from 'react';
import { pipelinesApi } from '../utils/pipelinesApi';

export function ModalGerenciarPipelines({ onClose, onSaveSuccess }) {
  const [activeSubTab, setActiveSubTab] = useState('pipelines'); // 'pipelines', 'etapas', 'passos'
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selection states
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedEtapaId, setSelectedEtapaId] = useState('');

  // Form states - Pipeline
  const [editingPipelineId, setEditingPipelineId] = useState(null); // null means adding new
  const [pipelineNome, setPipelineNome] = useState('');
  const [pipelineCodigo, setPipelineCodigo] = useState('');
  const [pipelineDescricao, setPipelineDescricao] = useState('');
  const [pipelineOrdem, setPipelineOrdem] = useState(1);
  const [pipelineAtivo, setPipelineAtivo] = useState(true);

  // Form states - Etapa
  const [editingEtapaId, setEditingEtapaId] = useState(null);
  const [etapaLabel, setEtapaLabel] = useState('');
  const [etapaHint, setEtapaHint] = useState('');
  const [etapaOrdem, setEtapaOrdem] = useState(1);

  // Form states - Passo
  const [editingPassoId, setEditingPassoId] = useState(null);
  const [passoTitulo, setPassoTitulo] = useState('');
  const [passoDescricao, setPassoDescricao] = useState('');
  const [passoOrdem, setPassoOrdem] = useState(1);

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function loadPipelines() {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await pipelinesApi.listarPipelines();
      // Sort by order
      data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setPipelines(data);
      if (data.length > 0) {
        // Keep or select default pipeline
        setSelectedPipelineId(prev => {
          const exists = data.some(p => p.id === prev);
          return exists ? prev : data[0].id;
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao carregar pipelines do servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Derived selected pipeline
  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
  const etapas = selectedPipeline ? [...(selectedPipeline.etapas || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : [];
  
  // Set default selected stage when pipeline changes
  useEffect(() => {
    if (etapas.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedEtapaId(prev => {
        const exists = etapas.some(e => e.id === prev);
        return exists ? prev : etapas[0].id;
      });
    } else {
      setSelectedEtapaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPipelineId, pipelines]);

  const selectedEtapa = etapas.find(e => e.id === selectedEtapaId);
  const passos = selectedEtapa ? [...(selectedEtapa.passos || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) : [];

  // ==========================================
  // PIPELINES HANDLERS
  // ==========================================
  function resetPipelineForm() {
    setEditingPipelineId(null);
    setPipelineNome('');
    setPipelineCodigo('');
    setPipelineDescricao('');
    setPipelineOrdem(pipelines.length + 1);
    setPipelineAtivo(true);
  }

  function handleStartEditPipeline(p) {
    setEditingPipelineId(p.id);
    setPipelineNome(p.nome);
    setPipelineCodigo(p.codigo);
    setPipelineDescricao(p.descricao || '');
    setPipelineOrdem(p.ordem || 1);
    setPipelineAtivo(p.ativo);
  }

  async function handleSavePipeline(e) {
    e.preventDefault();
    if (!pipelineNome.trim()) return;
    setLoading(true);
    try {
      if (editingPipelineId) {
        // Update
        await pipelinesApi.atualizarPipeline(editingPipelineId, {
          nome: pipelineNome.trim(),
          descricao: pipelineDescricao.trim() || null,
          ordem: parseInt(pipelineOrdem) || 1,
          ativo: pipelineAtivo,
        });
      } else {
        // Create
        if (!pipelineCodigo.trim()) return;
        await pipelinesApi.criarPipeline({
          codigo: pipelineCodigo.trim().toLowerCase(),
          nome: pipelineNome.trim(),
          descricao: pipelineDescricao.trim() || null,
          ordem: parseInt(pipelineOrdem) || 1,
        });
      }
      resetPipelineForm();
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar pipeline.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePipeline(id) {
    if (!window.confirm('Tem certeza que deseja excluir este pipeline? Todos os dados vinculados serão perdidos.')) return;
    setLoading(true);
    try {
      await pipelinesApi.deletarPipeline(id);
      if (selectedPipelineId === id) setSelectedPipelineId('');
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao excluir pipeline.');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ETAPAS HANDLERS
  // ==========================================
  function resetEtapaForm() {
    setEditingEtapaId(null);
    setEtapaLabel('');
    setEtapaHint('');
    setEtapaOrdem(etapas.length + 1);
  }

  function handleStartEditEtapa(et) {
    setEditingEtapaId(et.id);
    setEtapaLabel(et.label);
    setEtapaHint(et.hint || '');
    setEtapaOrdem(et.ordem || 1);
  }

  async function handleSaveEtapa(e) {
    e.preventDefault();
    if (!selectedPipelineId || !etapaLabel.trim()) return;
    setLoading(true);
    try {
      if (editingEtapaId) {
        // Update
        await pipelinesApi.atualizarEtapaPipeline(editingEtapaId, {
          label: etapaLabel.trim(),
          hint: etapaHint.trim() || null,
          ordem: parseInt(etapaOrdem) || 1,
        });
      } else {
        // Create
        await pipelinesApi.criarEtapaPipeline(selectedPipelineId, {
          label: etapaLabel.trim(),
          hint: etapaHint.trim() || null,
          ordem: parseInt(etapaOrdem) || 1,
        });
      }
      resetEtapaForm();
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar etapa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEtapa(id) {
    if (!window.confirm('Excluir esta coluna/etapa?')) return;
    setLoading(true);
    try {
      await pipelinesApi.deletarEtapaPipeline(id);
      if (selectedEtapaId === id) setSelectedEtapaId('');
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao excluir etapa.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveEtapa(index, direction) {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= etapas.length) return;
    setLoading(true);
    try {
      // Swap order arrays locally
      const reorderedList = [...etapas];
      const temp = reorderedList[index];
      reorderedList[index] = reorderedList[nextIdx];
      reorderedList[nextIdx] = temp;
      
      const orderedIds = reorderedList.map(et => et.id);
      await pipelinesApi.reordenarEtapasPipeline(selectedPipelineId, {
        etapasOrdenadasIds: orderedIds
      });
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao reordenar etapas.');
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // PASSOS HANDLERS
  // ==========================================
  function resetPassoForm() {
    setEditingPassoId(null);
    setPassoTitulo('');
    setPassoDescricao('');
    setPassoOrdem(passos.length + 1);
  }

  function handleStartEditPasso(ps) {
    setEditingPassoId(ps.id);
    setPassoTitulo(ps.titulo);
    setPassoDescricao(ps.descricao || '');
    setPassoOrdem(ps.ordem || 1);
  }

  async function handleSavePasso(e) {
    e.preventDefault();
    if (!selectedEtapaId || !passoTitulo.trim()) return;
    setLoading(true);
    try {
      if (editingPassoId) {
        await pipelinesApi.atualizarPassoPipeline(editingPassoId, {
          titulo: passoTitulo.trim(),
          descricao: passoDescricao.trim() || null,
          ordem: parseInt(passoOrdem) || 1,
        });
      } else {
        await pipelinesApi.criarPassoPipeline(selectedEtapaId, {
          titulo: passoTitulo.trim(),
          descricao: passoDescricao.trim() || null,
          ordem: parseInt(passoOrdem) || 1,
        });
      }
      resetPassoForm();
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar passo de checklist.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePasso(id) {
    if (!window.confirm('Excluir este passo do checklist?')) return;
    setLoading(true);
    try {
      await pipelinesApi.deletarPassoPipeline(id);
      await loadPipelines();
      onSaveSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao excluir passo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ae-modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ae-modal" style={{ maxWidth: '900px', width: '90%' }} role="dialog" aria-modal="true">
        <div className="ae-modal-header" style={{ padding: '16px 24px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Gerenciamento de Fluxos (Pipelines)</h3>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Crie e customize pipelines, colunas de Kanban e checklists padrão.</span>
          </div>
          <button type="button" className="ae-modal-close" aria-label="Fechar" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Sub-tabs header */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--rule-2)', padding: '0 24px', background: '#fafafa' }}>
          {[
            { id: 'pipelines', label: '1. Pipelines' },
            { id: 'etapas', label: '2. Colunas / Etapas' },
            { id: 'passos', label: '3. Checklist Padrão' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id);
                setErrorMsg('');
              }}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: activeSubTab === tab.id ? 'var(--gold-deep)' : 'var(--muted)',
                borderBottom: activeSubTab === tab.id ? '2.5px solid var(--gold-deep)' : '2.5px solid transparent',
                marginBottom: '-1px',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{ margin: '16px 24px 0', padding: '10px 14px', backgroundColor: 'var(--danger-tint)', color: 'var(--danger)', borderRadius: '6px', fontSize: '13px' }}>
            {errorMsg}
          </div>
        )}

        <div className="ae-modal-body" style={{ minHeight: '380px', maxHeight: '60vh', overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* TAB 1: PIPELINES */}
          {activeSubTab === 'pipelines' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--ink-900)' }}>Pipelines Ativos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pipelines.map(p => (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px',
                        border: '1px solid var(--rule)',
                        borderRadius: '8px',
                        background: selectedPipelineId === p.id ? 'var(--gold-soft)' : '#fff',
                        borderColor: selectedPipelineId === p.id ? 'var(--gold-deep)' : 'var(--rule)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPipelineId(p.id);
                          handleStartEditPipeline(p);
                        }}
                        style={{ textAlign: 'left', flex: 1 }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink-900)' }}>
                          {p.nome} {!p.ativo && <span style={{ color: 'var(--danger)', fontSize: '11px' }}>(Inativo)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          Código: <code>{p.codigo}</code> | Ordem: {p.ordem}
                        </div>
                      </button>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="ae-btn ae-btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                          title="Editar"
                          onClick={() => {
                            setSelectedPipelineId(p.id);
                            handleStartEditPipeline(p);
                          }}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="ae-btn ae-btn-secondary"
                          style={{ width: '28px', height: '28px', padding: 0, color: 'var(--danger)' }}
                          title="Excluir"
                          onClick={() => handleDeletePipeline(p.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {pipelines.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                      Nenhum pipeline configurado.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--rule-2)', paddingLeft: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--ink-900)', margin: 0 }}>
                    {editingPipelineId ? 'Editar Pipeline' : 'Adicionar Novo Pipeline'}
                  </h4>
                  {editingPipelineId && (
                    <button
                      type="button"
                      style={{ fontSize: '12px', color: 'var(--gold-deep)', fontWeight: 600 }}
                      onClick={resetPipelineForm}
                    >
                      + Criar Novo
                    </button>
                  )}
                </div>
                <form onSubmit={handleSavePipeline} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Nome Comercial *</label>
                    <input
                      type="text"
                      className="ae-input"
                      required
                      placeholder="Ex: Abertura de empresa"
                      value={pipelineNome}
                      onChange={e => setPipelineNome(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Código Único (Sem espaços) *</label>
                    <input
                      type="text"
                      className="ae-input"
                      required
                      disabled={!!editingPipelineId}
                      placeholder="Ex: abertura"
                      value={pipelineCodigo}
                      onChange={e => setPipelineCodigo(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Descrição</label>
                    <textarea
                      className="ae-input"
                      placeholder="Breve sumário do fluxo..."
                      value={pipelineDescricao}
                      onChange={e => setPipelineDescricao(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none', resize: 'none', height: '60px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600 }}>Ordem de Exibição *</label>
                      <input
                        type="number"
                        className="ae-input"
                        required
                        min="1"
                        value={pipelineOrdem}
                        onChange={e => setPipelineOrdem(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                      />
                    </div>
                    {editingPipelineId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                        <input
                          type="checkbox"
                          id="chkAtivo"
                          checked={pipelineAtivo}
                          onChange={e => setPipelineAtivo(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-deep)' }}
                        />
                        <label htmlFor="chkAtivo" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Ativo no Portal</label>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="ae-btn ae-btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                    {editingPipelineId ? 'Salvar Alterações' : 'Cadastrar Pipeline'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: COLUNAS / ETAPAS */}
          {activeSubTab === 'etapas' && (
            <div>
              {/* Select pipeline dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--rule-2)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Selecionar Pipeline:</span>
                <select
                  value={selectedPipelineId}
                  onChange={e => setSelectedPipelineId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none', background: '#fff', fontSize: '13px' }}
                >
                  <option value="">-- Selecione --</option>
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {selectedPipelineId ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--ink-900)' }}>Colunas (Etapas) configuradas</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {etapas.map((et, index) => (
                        <div
                          key={et.id}
                          style={{
                            padding: '10px 12px',
                            border: '1px solid var(--rule)',
                            borderRadius: '8px',
                            background: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink-900)' }}>
                              {index + 1}. {et.label}
                            </div>
                            {et.hint && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{et.hint}</div>}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '6px' }}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveEtapa(index, -1)}
                                style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--rule)', borderRadius: '4px', background: index === 0 ? '#f0f0f0' : '#fff' }}
                                title="Subir etapa"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={index === etapas.length - 1}
                                onClick={() => handleMoveEtapa(index, 1)}
                                style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--rule)', borderRadius: '4px', background: index === etapas.length - 1 ? '#f0f0f0' : '#fff' }}
                                title="Descer etapa"
                              >
                                ▼
                              </button>
                            </div>

                            <button
                              type="button"
                              className="ae-btn ae-btn-secondary"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Editar"
                              onClick={() => handleStartEditEtapa(et)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="ae-btn ae-btn-secondary"
                              style={{ width: '28px', height: '28px', padding: 0, color: 'var(--danger)' }}
                              title="Excluir"
                              onClick={() => handleDeleteEtapa(et.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {etapas.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                          Nenhuma coluna configurada para este pipeline.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--rule-2)', paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', color: 'var(--ink-900)', margin: 0 }}>
                        {editingEtapaId ? 'Editar Coluna' : 'Adicionar Nova Coluna'}
                      </h4>
                      {editingEtapaId && (
                        <button
                          type="button"
                          style={{ fontSize: '12px', color: 'var(--gold-deep)', fontWeight: 600 }}
                          onClick={resetEtapaForm}
                        >
                          + Criar Nova
                        </button>
                      )}
                    </div>
                    <form onSubmit={handleSaveEtapa} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Rótulo / Título *</label>
                        <input
                          type="text"
                          className="ae-input"
                          required
                          placeholder="Ex: Viabilidade"
                          value={etapaLabel}
                          onChange={e => setEtapaLabel(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Hint / Subtítulo (Opcional)</label>
                        <input
                          type="text"
                          className="ae-input"
                          placeholder="Ex: Dia 1 ao dia 5"
                          value={etapaHint}
                          onChange={e => setEtapaHint(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Ordem da Etapa *</label>
                        <input
                          type="number"
                          className="ae-input"
                          required
                          min="1"
                          value={etapaOrdem}
                          onChange={e => setEtapaOrdem(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                        />
                      </div>

                      <button type="submit" className="ae-btn ae-btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                        {editingEtapaId ? 'Salvar Alterações' : 'Adicionar Coluna'}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  Selecione um pipeline no menu acima para gerenciar suas etapas.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHECKLIST PADRAO */}
          {activeSubTab === 'passos' && (
            <div>
              {/* Select pipeline & etapa dropdowns */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--rule-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>1. Selecionar Pipeline:</span>
                  <select
                    value={selectedPipelineId}
                    onChange={e => {
                      setSelectedPipelineId(e.target.value);
                      setSelectedEtapaId('');
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none', background: '#fff', fontSize: '13px' }}
                  >
                    <option value="">-- Selecione --</option>
                    {pipelines.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {selectedPipelineId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>2. Selecionar Coluna/Etapa:</span>
                    <select
                      value={selectedEtapaId}
                      onChange={e => setSelectedEtapaId(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none', background: '#fff', fontSize: '13px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {etapas.map(et => (
                        <option key={et.id} value={et.id}>{et.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {selectedPipelineId && selectedEtapaId ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--ink-900)' }}>Checklist Padrão da Coluna</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {passos.map((ps, index) => (
                        <div
                          key={ps.id}
                          style={{
                            padding: '10px 12px',
                            border: '1px solid var(--rule)',
                            borderRadius: '8px',
                            background: '#fff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink-900)' }}>
                              {index + 1}. {ps.titulo}
                            </div>
                            {ps.descricao && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{ps.descricao}</div>}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              className="ae-btn ae-btn-secondary"
                              style={{ width: '28px', height: '28px', padding: 0 }}
                              title="Editar"
                              onClick={() => handleStartEditPasso(ps)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="ae-btn ae-btn-secondary"
                              style={{ width: '28px', height: '28px', padding: 0, color: 'var(--danger)' }}
                              title="Excluir"
                              onClick={() => handleDeletePasso(ps.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      {passos.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                          Nenhum passo de checklist cadastrado nesta etapa.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--rule-2)', paddingLeft: '24px' }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', color: 'var(--ink-900)', margin: 0 }}>
                        {editingPassoId ? 'Editar Passo' : 'Adicionar Novo Passo'}
                      </h4>
                      {editingPassoId && (
                        <button
                          type="button"
                          style={{ fontSize: '12px', color: 'var(--gold-deep)', fontWeight: 600 }}
                          onClick={resetPassoForm}
                        >
                          + Criar Novo
                        </button>
                      )}
                    </div>
                    <form onSubmit={handleSavePasso} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Título do Item de Checklist *</label>
                        <input
                          type="text"
                          className="ae-input"
                          required
                          placeholder="Ex: Enviar viabilidade"
                          value={passoTitulo}
                          onChange={e => setPassoTitulo(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Descrição / Instrução Adicional</label>
                        <textarea
                          className="ae-input"
                          placeholder="Ex: Acessar coletor nacional e enviar protocolo..."
                          value={passoDescricao}
                          onChange={e => setPassoDescricao(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none', resize: 'none', height: '60px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600 }}>Ordem de Exibição *</label>
                        <input
                          type="number"
                          className="ae-input"
                          required
                          min="1"
                          value={passoOrdem}
                          onChange={e => setPassoOrdem(e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--rule)', outline: 'none' }}
                        />
                      </div>

                      <button type="submit" className="ae-btn ae-btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                        {editingPassoId ? 'Salvar Alterações' : 'Adicionar Passo'}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  Selecione um pipeline e uma etapa para gerenciar seu checklist.
                </div>
              )}
            </div>
          )}

        </div>

        <div className="ae-modal-footer" style={{ padding: '12px 24px' }}>
          <button type="button" className="ae-btn ae-btn-secondary" onClick={onClose} disabled={loading}>
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
