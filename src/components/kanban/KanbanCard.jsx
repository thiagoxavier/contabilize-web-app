import { useDraggable } from '@dnd-kit/core';
import { Icon } from '../icons';

const PRIORIDADE = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

function formatarData(iso) {
  // dueDate vem como "AAAA-MM-DD" (DateOnly); evitar deslocamento de fuso.
  const [a, m, d] = String(iso).split('-');
  return `${d}/${m}/${a}`;
}

function atrasado(iso) {
  const hoje = new Date();
  const ymd = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return String(iso) < ymd;
}

/** `overlay` desativa o drag (usado no DragOverlay, que só espelha o card). */
export default function KanbanCard({ card, usuariosPorId, onAbrir, overlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id, disabled: overlay });
  const prio = PRIORIDADE[card.prioridade] ? card.prioridade : 'media';
  const assigneeNome = card.assigneeId ? usuariosPorId?.[card.assigneeId]?.nome : null;

  return (
    <article
      ref={setNodeRef}
      className={'kp-card' + (isDragging ? ' kp-dragging' : '')}
      onClick={() => !overlay && onAbrir?.(card)}
      onKeyDown={(e) => { if (!overlay && e.key === 'Enter') onAbrir?.(card); }}
      {...attributes}
      {...listeners}
      aria-label={`Card ${card.titulo}`}
    >
      <div className="kp-card-top">
        <div className="kp-card-title">{card.titulo}</div>
        <span className={`kp-prio ${prio}`}>{PRIORIDADE[prio]}</span>
      </div>
      {card.descricao && <div className="kp-card-desc">{card.descricao}</div>}
      {card.tags?.length > 0 && (
        <div className="kp-tags">{card.tags.map((t) => <span key={t} className="kp-tag">{t}</span>)}</div>
      )}
      {(card.dueDate || assigneeNome) && (
        <div className="kp-card-foot">
          {card.dueDate && (
            <span className={atrasado(card.dueDate) ? 'kp-atrasado' : undefined}>
              <Icon name="clock" size={12} /> {formatarData(card.dueDate)}
            </span>
          )}
          {assigneeNome && (
            <span className="kp-assignee" title={`Responsável: ${assigneeNome}`}>
              <Icon name="users" size={12} /> {assigneeNome}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
