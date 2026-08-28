import { useState } from 'react';
import { Icon } from '../icons';
import { kanbanService } from '../../services/kanbanService';
import ChatPanel from './ChatPanel';

export default function CardModal({ card, usuarios = [], onClose, onSalvo, onExcluido, onToast }) {
  const [titulo, setTitulo] = useState(card.titulo);
  const [descricao, setDescricao] = useState(card.descricao || '');
  const [prioridade, setPrioridade] = useState(card.prioridade || 'media');
  const [assigneeId, setAssigneeId] = useState(card.assigneeId || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [tags, setTags] = useState((card.tags || []).join(', '));
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      const atualizado = await kanbanService.atualizarCard(card.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        prioridade,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onSalvo(atualizado);
    } catch (err) {
      onToast?.(err.message || 'Não foi possível salvar o card.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!window.confirm(`Excluir o card "${card.titulo}"?`)) return;
    try {
      await kanbanService.deletarCard(card.id);
      onExcluido(card.id);
    } catch (err) {
      onToast?.(err.message || 'Não foi possível excluir o card.');
    }
  };

  return (
    <div className="kp-overlay" onClick={onClose} role="presentation">
      <form
        className="kp-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={salvar}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes do card ${card.titulo}`}
      >
        <div className="kp-modal-head">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Título" required />
          <button type="button" className="kp-icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="kp-modal-body">
          <div className="field-group kp-span-2">
            <label htmlFor="kp-desc">Descrição</label>
            <textarea id="kp-desc" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes, contexto, links…" />
          </div>
          <div className="field-group">
            <label htmlFor="kp-prio">Prioridade</label>
            <select id="kp-prio" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="kp-due">Prazo</label>
            <input id="kp-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="field-group">
            <label htmlFor="kp-assignee">Responsável</label>
            <select id="kp-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Sem responsável</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
          <div className="field-group kp-span-2">
            <label htmlFor="kp-tags">Tags</label>
            <input id="kp-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Separe por vírgula: fiscal, urgente" />
            <span className="helper">Separe as tags por vírgula.</span>
          </div>
          <div className="kp-span-2">
            <ChatPanel cardId={card.id} onToast={onToast} />
          </div>
        </div>

        <div className="kp-modal-foot">
          <button type="button" className="btn danger btn-sm" onClick={excluir}>
            <Icon name="trash" size={14} /> Excluir card
          </button>
          <div className="kp-right">
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn primary" disabled={salvando || !titulo.trim()}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
