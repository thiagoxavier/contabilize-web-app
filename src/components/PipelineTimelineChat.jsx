import { useState, useEffect, useCallback, useRef } from 'react';
import { pipelinesApi } from '../utils/pipelinesApi';

/**
 * Formata ISO date para DD/MM/AAAA
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata ISO datetime para HH:MM
 */
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Retorna initials de um nome
 */
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function SkeletonEntry() {
  return (
    <div className="ae-timeline-entry" style={{ opacity: 0.5 }}>
      <div style={{ width: '52px', height: '20px', background: 'var(--paper-2)', borderRadius: '4px' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '80%', height: '14px', background: 'var(--paper-2)', borderRadius: '4px', marginBottom: '6px' }} />
        <div style={{ width: '50%', height: '12px', background: 'var(--paper-2)', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

function EventoItem({ evento, onEdit, onDelete, autorNome, isAdmin }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canEdit = isAdmin || evento.autorNome === autorNome;

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(evento.id);
  }

  return (
    <div className="ae-timeline-entry">
      <div className="ae-timeline-left">
        <span className="ae-timeline-date-badge">{formatDate(evento.dataEvento)}</span>
      </div>
      <div className="ae-timeline-content">
        <p className="ae-timeline-entry-text">{evento.descricao}</p>
        <div className="ae-timeline-meta">
          <span className="ae-avatar" style={{ width: '20px', height: '20px', fontSize: '9px', background: '#13A170' }}>
            {getInitials(evento.autorNome || 'U')}
          </span>
          <span className="ae-timeline-author">
            {evento.autorNome || 'Desconhecido'} · {formatTime(evento.criadoEm || evento.dataEvento)}
          </span>
        </div>
      </div>
      {canEdit && (
        <div className="ae-timeline-actions">
          {confirmDelete ? (
            <>
              <button
                type="button"
                className="ae-timeline-btn ae-timeline-btn-danger"
                onClick={handleDelete}
                aria-label="Confirmar exclusão"
              >
                Confirmar
              </button>
              <button
                type="button"
                className="ae-timeline-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ae-timeline-btn"
                onClick={() => onEdit(evento)}
                aria-label="Editar evento"
                title="Editar"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                type="button"
                className="ae-timeline-btn ae-timeline-btn-delete"
                onClick={handleDelete}
                aria-label="Excluir evento"
                title="Excluir"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * PipelineTimelineChat — feed de atividades + formulário de novo evento.
 *
 * Props:
 *   empresaId: string
 *   autorNome: string — nome do usuário logado
 *   isAdmin: boolean
 */
export function PipelineTimelineChat({ empresaId, autorNome, isAdmin }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Form de novo evento
  const today = new Date().toISOString().split('T')[0];
  const [novaData, setNovaData] = useState(today);
  const [novaDesc, setNovaDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Edição inline
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const feedRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const loadEventos = useCallback(async () => {
    if (!empresaId) return;
    try {
      const data = await pipelinesApi.listarEventosPipeline(empresaId);
      // Ordenar da mais recente para mais antiga
      const sorted = [...(data || [])].sort((a, b) => {
        const dA = new Date(a.dataEvento);
        const dB = new Date(b.dataEvento);
        return dB - dA;
      });
      setEventos(sorted);
    } catch (err) {
      setError(err.message || 'Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!novaDesc.trim()) { setFormError('A descrição é obrigatória.'); return; }
    if (!novaData) { setFormError('A data do evento é obrigatória.'); return; }
    setFormError(null);
    setSubmitting(true);
    try {
      const criado = await pipelinesApi.criarEventoPipeline(empresaId, {
        dataEvento: novaData,
        descricao: novaDesc.trim(),
        autorNome: autorNome || 'Usuário',
      });
      setEventos(prev => [criado, ...prev]);
      setNovaDesc('');
      setNovaData(today);
      showToast('Evento registrado.');
      // Scroll ao topo do feed
      if (feedRef.current) feedRef.current.scrollTop = 0;
    } catch (err) {
      setFormError(err.message || 'Erro ao registrar evento.');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(evento) {
    setEditingId(evento.id);
    setEditData(evento.dataEvento ? new Date(evento.dataEvento).toISOString().split('T')[0] : '');
    setEditDesc(evento.descricao);
  }

  async function saveEdit(eventoId) {
    if (!editDesc.trim()) return;
    setEditSaving(true);
    try {
      const updated = await pipelinesApi.atualizarEventoPipeline(empresaId, eventoId, {
        dataEvento: editData,
        descricao: editDesc.trim(),
      });
      setEventos(prev => prev.map(e => e.id === eventoId ? { ...e, ...updated } : e));
      setEditingId(null);
      showToast('Evento atualizado.');
    } catch (err) {
      setFormError(err.message || 'Erro ao atualizar evento.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(eventoId) {
    try {
      await pipelinesApi.deletarEventoPipeline(empresaId, eventoId);
      setEventos(prev => prev.filter(e => e.id !== eventoId));
      showToast('Evento excluído.');
    } catch (err) {
      setError(err.message || 'Erro ao excluir evento.');
    }
  }

  return (
    <div className="ae-timeline-panel">
      {toast && <div className="ae-toast">{toast}</div>}

      <div className="ae-datas-section-title" style={{ marginBottom: '12px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Timeline / Chat
      </div>

      {/* ---- Formulário novo evento ---- */}
      <form className="ae-timeline-form" onSubmit={handleSubmit} noValidate>
        <div className="ae-timeline-form-row">
          <div className="ae-datas-field" style={{ minWidth: '150px' }}>
            <label className="ae-datas-label">Data do evento</label>
            <input
              type="date"
              className="ae-input ae-date-input ae-date-sm"
              aria-label="Data do evento"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="ae-datas-field" style={{ flex: 1 }}>
            <label className="ae-datas-label">Descrição</label>
            <textarea
              className="ae-input ae-textarea"
              aria-label="Descrição do evento"
              aria-required="true"
              placeholder="Descreva o que aconteceu..."
              value={novaDesc}
              onChange={(e) => { setNovaDesc(e.target.value); setFormError(null); }}
              disabled={submitting}
              rows={2}
              required
            />
          </div>
        </div>
        {formError && <div className="ae-field-error">{formError}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="ae-btn ae-btn-primary"
            style={{ height: '36px', fontSize: '13px' }}
            disabled={submitting || !novaDesc.trim()}
          >
            {submitting ? 'Registrando...' : 'Registrar'}
          </button>
        </div>
      </form>

      {/* ---- Feed de eventos ---- */}
      {error && (
        <div className="ae-error-banner">
          {error}
          <button type="button" onClick={() => { setError(null); loadEventos(); }}>Tentar novamente</button>
        </div>
      )}

      <div className="ae-timeline-feed" ref={feedRef} role="list">
        {loading ? (
          <>
            <SkeletonEntry />
            <SkeletonEntry />
          </>
        ) : eventos.length === 0 ? (
          <div className="ae-timeline-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Nenhum evento registrado ainda.</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Adicione o primeiro acima.</p>
          </div>
        ) : (
          eventos.map(evento => {
            if (editingId === evento.id) {
              return (
                <div key={evento.id} className="ae-timeline-entry ae-timeline-editing" role="listitem">
                  <div className="ae-timeline-left">
                    <input
                      type="date"
                      className="ae-input ae-date-input ae-date-sm"
                      value={editData}
                      onChange={(e) => setEditData(e.target.value)}
                      style={{ minWidth: '120px' }}
                    />
                  </div>
                  <div className="ae-timeline-content" style={{ flex: 1 }}>
                    <textarea
                      className="ae-input ae-textarea"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                      <button type="button" className="ae-btn ae-btn-secondary" style={{ height: '30px', fontSize: '12px' }} onClick={() => setEditingId(null)} disabled={editSaving}>Cancelar</button>
                      <button type="button" className="ae-btn ae-btn-primary" style={{ height: '30px', fontSize: '12px' }} onClick={() => saveEdit(evento.id)} disabled={editSaving || !editDesc.trim()}>
                        {editSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={evento.id} role="listitem">
                <EventoItem
                  evento={evento}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  autorNome={autorNome}
                  isAdmin={isAdmin}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
