import { useState } from 'react';
import { Icon } from './icons';

/**
 * PassoCard — card de um Passo dentro de uma <EtapaColumn/> (PRD-KANBAN §5.4).
 *
 * Puramente controlado por props: não acessa o KanbanContext diretamente (quem
 * orquestra a chamada de rede é o <KanbanBoard/>). Isso o mantém testável em
 * isolamento e evita duplicar a lógica de mover-com-rollback em dois lugares.
 *
 * Drag-and-drop nativo (HTML5 DnD) é a via principal de mover o card entre
 * colunas, mas ela não é operável por teclado/touch — por isso o card também
 * expõe um <select> "Mover para" sempre visível, que dispara a mesma ação.
 * Isso cobre o requisito de acessibilidade (WCAG 2.1 AA) sem exigir uma
 * biblioteca de drag-and-drop.
 *
 * Props:
 *   passo: PassoDto { id, etapaId, titulo, descricao, tags, responsavelId, mensagens }
 *   etapasDisponiveis: Array<{ id, label }> — etapas (exceto a atual) para o "Mover para"
 *   onMover(novaEtapaId): chamado ao soltar o drag ou escolher no select
 *   onClick(): chamado ao clicar/ativar o título do card (abre detalhe/modal)
 *   disabled: bool — desabilita drag e os controles (ação em andamento em QUALQUER card)
 *   isMoving: bool — este card específico está sendo movido agora (mostra spinner)
 */
export function PassoCard({ passo, etapasDisponiveis = [], onMover, onClick, disabled = false, isMoving = false }) {
  const [dragging, setDragging] = useState(false);

  const bloqueado = disabled || isMoving;

  function handleDragStart(e) {
    if (bloqueado) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', passo.id);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(true);
  }

  function handleDragEnd() {
    setDragging(false);
  }

  function handleMoverSelect(e) {
    const novaEtapaId = e.target.value;
    e.target.value = '';
    if (novaEtapaId) {
      onMover?.(novaEtapaId);
    }
  }

  const tags = Array.isArray(passo.tags) ? passo.tags : [];
  const qtdMensagens = Array.isArray(passo.mensagens) ? passo.mensagens.length : 0;

  return (
    <div
      className={`kb-card${dragging ? ' kb-card-dragging' : ''}${isMoving ? ' kb-card-moving' : ''}`}
      draggable={!bloqueado}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-busy={isMoving || undefined}
      role="listitem"
      data-testid="passo-card"
      data-passo-id={passo.id}
    >
      {isMoving && (
        <div className="kb-card-spinner-overlay" role="status" aria-label="Movendo passo...">
          <span className="kb-spinner" />
        </div>
      )}

      <button
        type="button"
        className="kb-card-title-btn"
        onClick={onClick}
        disabled={bloqueado}
        title={passo.titulo}
      >
        {passo.titulo}
      </button>

      {passo.descricao && <p className="kb-card-desc">{passo.descricao}</p>}

      {tags.length > 0 && (
        <div className="kb-card-tags">
          {tags.map((tag) => (
            <span key={tag} className="kb-card-tag">{tag}</span>
          ))}
        </div>
      )}

      <div className="kb-card-footer">
        <div className="kb-card-badges">
          {passo.responsavelId && (
            <span className="kb-card-badge" title="Passo com responsável atribuído">
              <Icon name="users" size={13} />
            </span>
          )}
          {qtdMensagens > 0 && (
            <span className="kb-card-badge" title={`${qtdMensagens} mensagem(ns)`}>
              <Icon name="file" size={13} />
              {qtdMensagens}
            </span>
          )}
        </div>

        {etapasDisponiveis.length > 0 && (
          <select
            className="kb-card-move-select"
            aria-label={`Mover passo "${passo.titulo}" para outra etapa`}
            value=""
            disabled={bloqueado}
            onChange={handleMoverSelect}
          >
            <option value="">Mover para...</option>
            {etapasDisponiveis.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>{etapa.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
