import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Icon } from '../icons';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ coluna, cards, cardsExibidos, usuariosPorId, onCriarCard, onRenomear, onExcluir, onAbrirCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.id });
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(coluna.nome);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState('');

  const noLimite = coluna.limiteCards != null && cards.length >= coluna.limiteCards;

  const confirmarNome = () => {
    setEditando(false);
    const novo = nome.trim();
    if (novo && novo !== coluna.nome) onRenomear(coluna, novo);
    else setNome(coluna.nome);
  };

  const confirmarCard = async (e) => {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    await onCriarCard(coluna.id, t);
    setTitulo('');
    setCriando(false);
  };

  return (
    <section
      ref={setNodeRef}
      className={'kp-column' + (isOver ? ' kp-over' : '')}
      style={coluna.cor ? { borderTopColor: coluna.cor } : undefined}
      aria-label={`Coluna ${coluna.nome}`}
    >
      <header className="kp-column-head">
        <div className="kp-column-title" onDoubleClick={() => setEditando(true)} title="Clique duas vezes para renomear">
          {editando ? (
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onBlur={confirmarNome}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmarNome(); if (e.key === 'Escape') { setNome(coluna.nome); setEditando(false); } }}
              aria-label="Nome da coluna"
            />
          ) : coluna.nome}
        </div>
        <div className="kp-column-actions">
          <span className={'kp-count' + (noLimite ? ' kp-limite' : '')} title={coluna.limiteCards != null ? `Limite: ${coluna.limiteCards}` : undefined}>
            {cards.length}{coluna.limiteCards != null ? `/${coluna.limiteCards}` : ''}
          </span>
          <button className="kp-icon-btn" onClick={() => setEditando(true)} title="Renomear coluna" aria-label="Renomear coluna">
            <Icon name="edit" size={14} />
          </button>
          <button className="kp-icon-btn danger" onClick={() => onExcluir(coluna)} title="Excluir coluna" aria-label="Excluir coluna">
            <Icon name="trash" size={14} />
          </button>
        </div>
      </header>

      <div className="kp-cards">
        {cards.length === 0 && !criando && <div className="kp-empty-col">Arraste um card para cá ou crie um novo.</div>}
        {cards.length > 0 && cardsExibidos.length === 0 && (
          <div className="kp-empty-col">Nenhum card corresponde aos filtros nesta coluna.</div>
        )}
        {cardsExibidos.map((card) => (
          <KanbanCard key={card.id} card={card} usuariosPorId={usuariosPorId} onAbrir={onAbrirCard} />
        ))}
      </div>

      {criando ? (
        <form className="kp-add-form" onSubmit={confirmarCard}>
          <input
            autoFocus
            placeholder="Título do card"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { setTitulo(''); setCriando(false); } }}
            aria-label="Título do novo card"
          />
          <div className="kp-add-form-actions">
            <button type="button" className="btn ghost btn-sm" onClick={() => { setTitulo(''); setCriando(false); }}>Cancelar</button>
            <button type="submit" className="btn primary btn-sm" disabled={!titulo.trim()}>Criar</button>
          </div>
        </form>
      ) : (
        <button className="kp-add-card" onClick={() => setCriando(true)} disabled={noLimite} title={noLimite ? 'Coluna no limite de cards' : undefined}>
          <Icon name="plus" size={14} /> Novo card
        </button>
      )}
    </section>
  );
}
