import { useState, useEffect } from 'react';
import { pipelinesApi } from '../utils/pipelinesApi';

/**
 * Formata data ISO (AAAA-MM-DD ou ISO string) para DD/MM/AAAA
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Converte DD/MM/AAAA para AAAA-MM-DD (para input[type=date])
 */
function toInputDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function StatusBadge({ dataInicio, dataFim }) {
  if (!dataInicio) return <span className="ae-tag ae-tag-neutral">Não iniciada</span>;
  if (!dataFim) return <span className="ae-tag ae-tag-info">Em andamento</span>;
  return <span className="ae-tag ae-tag-success">Concluída em {formatDate(dataFim)}</span>;
}

/**
 * PipelineDatasPanel — exibe e edita EXCLUSIVAMENTE as datas de início/fim do pipeline.
 *
 * Props:
 *   empresaId: string
 *   pipeline: EmpresaPipelineDto (dados da API)
 *   onUpdate: fn — chamado após salvar com sucesso
 */
export function PipelineDatasPanel({ empresaId, pipeline, onUpdate }) {
  const [pipelineData, setPipelineData] = useState(pipeline || null);
  const [loading, setLoading] = useState(!pipeline);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dateError, setDateError] = useState(null);

  // Carrega dados se não fornecidos via props
  useEffect(() => {
    if (pipeline) {
      setPipelineData(pipeline);
      setLoading(false);
      return;
    }
    if (!empresaId) return;
    setLoading(true);
    pipelinesApi.buscarEmpresaPipeline(empresaId)
      .then(data => { setPipelineData(data); setLoading(false); })
      .catch(err => { setError(err.message || 'Erro ao carregar dados.'); setLoading(false); });
  }, [empresaId, pipeline]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Valida se DataFim >= DataInicio
  function validateDates(inicio, fim) {
    if (!inicio || !fim) return null;
    const dI = new Date(inicio);
    const dF = new Date(fim);
    if (dF < dI) return 'Data de fim não pode ser anterior à data de início.';
    return null;
  }

  async function handlePipelineDate(field, value) {
    const current = pipelineData || {};
    const novoInicio = field === 'dataInicio' ? value : current.dataInicio;
    const novoFim = field === 'dataFim' ? value : current.dataFim;

    const err = validateDates(novoInicio, novoFim);
    if (err) {
      setDateError(err);
      return;
    }
    setDateError(null);

    setSaving(true);
    try {
      const updated = await pipelinesApi.atualizarDatasEmpresaPipeline(empresaId, {
        dataInicio: novoInicio || null,
        dataFim: novoFim || null,
      });
      setPipelineData(prev => ({ ...prev, ...updated }));
      showToast('Data do pipeline atualizada com sucesso.');
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.message || 'Erro ao salvar data.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ae-datas-panel">
        <div className="ae-skeleton" style={{ height: '24px', borderRadius: '6px', marginBottom: '12px', background: 'var(--paper-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div className="ae-skeleton" style={{ height: '60px', borderRadius: '6px', background: 'var(--paper-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <div className="ae-datas-panel">
      {toast && <div className="ae-toast">{toast}</div>}

      {/* ---- Período do Pipeline ---- */}
      <div className="ae-datas-section">
        <div className="ae-datas-section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Período do Pipeline
          <StatusBadge dataInicio={pipelineData?.dataInicio} dataFim={pipelineData?.dataFim} />
        </div>

        {error && (
          <div className="ae-error-banner">
            {error}
            <button type="button" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="ae-datas-row">
          <div className="ae-datas-field">
            <label aria-label="Data de início do pipeline" className="ae-datas-label">
              Data de Início
            </label>
            <div className="ae-input-wrap">
              <svg className="ae-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                type="date"
                className="ae-input ae-date-input"
                aria-label="Data de início do pipeline"
                value={toInputDate(pipelineData?.dataInicio)}
                disabled={saving}
                onChange={(e) => handlePipelineDate('dataInicio', e.target.value)}
              />
            </div>
          </div>

          <div className="ae-datas-field">
            <label aria-label="Data de fim do pipeline" className="ae-datas-label">
              Data de Fim
            </label>
            <div className="ae-input-wrap">
              <svg className="ae-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <input
                type="date"
                className="ae-input ae-date-input"
                aria-label="Data de fim do pipeline"
                value={toInputDate(pipelineData?.dataFim)}
                disabled={saving}
                onChange={(e) => handlePipelineDate('dataFim', e.target.value)}
              />
            </div>
          </div>
        </div>
        {dateError && <div className="ae-field-error">{dateError}</div>}
        {saving && <div className="ae-saving-indicator">Salvando...</div>}
      </div>
    </div>
  );
}
