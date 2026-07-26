import { useEffect } from 'react';
import { getInitials, avatarColor, statusOf } from '../data/abertura';
import { PipelineDatasPanel } from './PipelineDatasPanel';
import { PipelineTimelineChat } from './PipelineTimelineChat';

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

/**
 * EmpresaDetalheDrawer — painel lateral (drawer) com detalhe completo de uma empresa no pipeline.
 */
export function EmpresaDetalheDrawer({ empresa, user, isAdmin, pipeline, onToggleStep, onMove, onClose, onUpdate }) {
  // Fechar com Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const autorNome = user?.name || user?.nome || 'Usuário';

  if (!empresa) return null;

  const cols = pipeline ? pipeline.columns : [];
  const idx = cols.findIndex((c) => c.id === empresa.columnId);
  const col = idx >= 0 ? cols[idx] : cols[0];
  const st = statusOf(empresa.checked || []);
  const isFirst = idx <= 0;
  const isLast = idx === cols.length - 1;
  const allChecked = empresa.checked && empresa.checked.length > 0 && empresa.checked.every(Boolean);

  const stepsList = (empresa.currentPassos && empresa.currentPassos.length > 0)
    ? empresa.currentPassos.map(p => p.titulo)
    : (col ? col.steps : []);

  return (
    <div
      className="ae-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${empresa.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ae-drawer ae-drawer-wide">
        {/* ---- Header ---- */}
        <div className="ae-drawer-header">
          <div className="ae-drawer-title-wrap">
            <div className="ae-drawer-avatar">
              {(empresa.name || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="ae-drawer-title">{empresa.name} — {col ? col.label : 'Etapa'}</h2>
              <p className="ae-drawer-subtitle">
                {empresa.pipelineCode || 'Pipeline'} · ID {empresa.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ae-modal-close"
            aria-label="Fechar painel"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* ---- Body: Layout em Duas Colunas Lado a Lado ---- */}
        <div className="ae-drawer-body-grid">
          {/* Coluna da Esquerda: Jornada / Checklist / Progresso */}
          <div className="ae-drawer-column">
            <div className="ae-responsible-row" style={{ marginBottom: '16px' }}>
              <div className="ae-responsible">
                <Avatar name={empresa.responsible || 'Sem responsável'} size="md" />
                <div>
                  <div className="ae-responsible-label">Responsável</div>
                  <div className="ae-responsible-name">{empresa.responsible || 'Não atribuído'}</div>
                </div>
              </div>
              <Tag status={st.tagStatus} label={st.tagLabel} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="ae-progress-label-row">
                <span>Progresso da etapa</span>
                <span>{st.pct}%</span>
              </div>
              <div className="ae-progress ae-progress-lg">
                <div className="ae-progress-fill" style={{ width: `${st.pct}%` }} />
              </div>
            </div>

            <div>
              <div className="ae-checklist-title">Checklist da etapa</div>
              {stepsList.map((label, i) => (
                <div className="ae-checklist-item" key={i}>
                  <label className="ae-checkbox-label">
                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                      <input
                        type="checkbox"
                        className="ae-checkbox-input"
                        checked={!!(empresa.checked && empresa.checked[i])}
                        onChange={() => onToggleStep && onToggleStep(empresa.id, i)}
                      />
                      <span className={'ae-checkbox-box' + (empresa.checked && empresa.checked[i] ? ' checked' : '')}>
                        {empresa.checked && empresa.checked[i] && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span className="ae-checkbox-text">{label}</span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              {!isFirst && onMove && (
                <button type="button" className="ae-btn ae-btn-secondary" onClick={() => onMove(empresa.id, -1)}>
                  Etapa anterior
                </button>
              )}
              {!isLast && onMove && (
                <button type="button" className="ae-btn ae-btn-primary" disabled={!allChecked} onClick={() => onMove(empresa.id, 1)}>
                  Concluir e avançar
                </button>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Período do Pipeline + Timeline / Chat */}
          <div className="ae-drawer-column">
            <section className="ae-drawer-section">
              <PipelineDatasPanel
                empresaId={empresa.id}
                onUpdate={onUpdate}
              />
            </section>

            <div className="ae-drawer-divider" style={{ margin: '16px 0' }} />

            <section className="ae-drawer-section">
              <PipelineTimelineChat
                empresaId={empresa.id}
                autorNome={autorNome}
                isAdmin={isAdmin}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

