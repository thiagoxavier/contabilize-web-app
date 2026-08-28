import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCorners, useSensor, useSensors,
} from '@dnd-kit/core';
import { Icon } from '../icons';
import { kanbanService } from '../../services/kanbanService';
import { usuariosApi } from '../../utils/usuariosApi';
import { useKanban } from '../../hooks/useKanban';
import { useKanbanSocket } from '../../hooks/useKanbanSocket';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardModal from './CardModal';
import KanbanFilterBar from './KanbanFilterBar';
import './kanban.css';

const FILTROS_PADRAO = { prioridade: '', responsavelId: '', prazoDe: '', prazoAte: '' };

function cardPassaNosFiltros(card, filtros) {
  if (filtros.prioridade && card.prioridade !== filtros.prioridade) return false;
  if (filtros.responsavelId && card.assigneeId !== filtros.responsavelId) return false;
  if (filtros.prazoDe && (!card.dueDate || card.dueDate < filtros.prazoDe)) return false;
  if (filtros.prazoAte && (!card.dueDate || card.dueDate > filtros.prazoAte)) return false;
  return true;
}

// --- helpers puros sobre o mapa colunaId -> Card[] ---------------------------
const semCard = (cards, cardId) =>
  Object.fromEntries(Object.entries(cards).map(([col, lista]) => [col, lista.filter((c) => c.id !== cardId)]));

const comCard = (cards, card) => {
  const limpo = semCard(cards, card.id);
  const lista = [...(limpo[card.colunaId] || []), card].sort((a, b) => a.posicao - b.posicao);
  return { ...limpo, [card.colunaId]: lista };
};

const colunaDoCard = (cards, cardId) =>
  Object.keys(cards).find((col) => cards[col].some((c) => c.id === cardId));

/**
 * Board de um plano: colunas, cards (drag-and-drop entre colunas), modal do card
 * e sincronização em tempo real via SignalR.
 */
export default function KanbanBoard({ planoId, onToast }) {
  const { colunas, setColunas, cards, setCards, loading, erro, recarregar } = useKanban(planoId);
  const [cardAberto, setCardAberto] = useState(null);
  const [arrastando, setArrastando] = useState(null);
  const [novaColuna, setNovaColuna] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);

  useEffect(() => {
    usuariosApi.listarUsuarios()
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => {
        // Falha ao carregar responsáveis não deve travar o board: os seletores de
        // responsável (filtro e modal) simplesmente ficam só com "Todos"/"Sem responsável".
      });
  }, []);

  const usuariosPorId = useMemo(
    () => Object.fromEntries(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  const aplicarFiltros = (parcial) => setFiltros((atual) => ({ ...atual, ...parcial }));

  useKanbanSocket(planoId, {
    ColunaCriada: (col) => setColunas((atual) => (atual.some((c) => c.id === col.id) ? atual : [...atual, col])),
    ColunaAtualizada: (col) => setColunas((atual) => atual.map((c) => (c.id === col.id ? col : c))),
    ColunaDeletada: ({ colunaId }) => {
      setColunas((atual) => atual.filter((c) => c.id !== colunaId));
      setCards((atual) => Object.fromEntries(Object.entries(atual).filter(([col]) => col !== colunaId)));
    },
    CardCriado: (card) => setCards((atual) => comCard(atual, card)),
    CardAtualizado: (card) => setCards((atual) => comCard(atual, card)),
    CardMovido: (card) => setCards((atual) => comCard(atual, card)),
    CardDeletado: ({ cardId }) => setCards((atual) => semCard(atual, cardId)),
    onErro: () => onToast?.('Sem conexão em tempo real; as alterações de outros usuários exigem recarregar.'),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setArrastando(null);
    if (!over) return;
    const origem = colunaDoCard(cards, active.id);
    const destino = String(over.id);
    if (!origem || origem === destino) return;

    const card = cards[origem].find((c) => c.id === active.id);
    const anterior = cards;
    setCards(comCard(cards, { ...card, colunaId: destino, posicao: Number.MAX_SAFE_INTEGER }));
    try {
      const movido = await kanbanService.moverCard(card.id, destino);
      setCards((atual) => comCard(atual, movido));
    } catch (err) {
      setCards(anterior);
      onToast?.(err.message || 'Não foi possível mover o card.');
    }
  }, [cards, setCards, onToast]);

  const criarColuna = async (e) => {
    e.preventDefault();
    const nome = novaColuna.trim();
    if (!nome) return;
    try {
      const col = await kanbanService.criarColuna(planoId, { nome });
      setColunas((atual) => (atual.some((c) => c.id === col.id) ? atual : [...atual, col]));
      setCards((atual) => ({ ...atual, [col.id]: atual[col.id] || [] }));
      setNovaColuna('');
    } catch (err) {
      onToast?.(err.message || 'Não foi possível criar a coluna.');
    }
  };

  const renomearColuna = async (coluna, nome) => {
    try {
      const col = await kanbanService.atualizarColuna(coluna.id, { ...coluna, nome });
      setColunas((atual) => atual.map((c) => (c.id === col.id ? col : c)));
    } catch (err) {
      onToast?.(err.message || 'Não foi possível renomear a coluna.');
    }
  };

  const excluirColuna = async (coluna) => {
    const qtd = (cards[coluna.id] || []).length;
    const aviso = qtd > 0 ? ` Os ${qtd} card(s) dela também serão excluídos.` : '';
    if (!window.confirm(`Excluir a coluna "${coluna.nome}"?${aviso}`)) return;
    try {
      await kanbanService.deletarColuna(coluna.id);
      setColunas((atual) => atual.filter((c) => c.id !== coluna.id));
    } catch (err) {
      onToast?.(err.message || 'Não foi possível excluir a coluna.');
    }
  };

  const criarCard = async (colunaId, titulo) => {
    try {
      const card = await kanbanService.criarCard(colunaId, { titulo });
      setCards((atual) => comCard(atual, card));
    } catch (err) {
      onToast?.(err.message || 'Não foi possível criar o card.');
    }
  };

  if (loading) {
    return <div className="empty"><h3>Carregando quadro…</h3></div>;
  }
  if (erro) {
    return (
      <div className="empty">
        <Icon name="alert" size={36} stroke={1.4} />
        <h3>Não foi possível carregar o quadro</h3>
        <p>{erro}</p>
        <button className="btn secondary" onClick={recarregar}>Tentar novamente</button>
      </div>
    );
  }

  const cardArrastado = arrastando ? Object.values(cards).flat().find((c) => c.id === arrastando) : null;

  return (
    <>
      <div className="kp-board-toolbar">
        <form onSubmit={criarColuna}>
          <input
            aria-label="Nome da nova coluna"
            placeholder="Nova coluna (ex.: A fazer, Em andamento, Concluído)"
            value={novaColuna}
            onChange={(e) => setNovaColuna(e.target.value)}
          />
          <button type="submit" className="btn primary btn-sm" disabled={!novaColuna.trim()}>
            <Icon name="plus" size={14} /> Adicionar coluna
          </button>
        </form>
        <button className="btn ghost btn-sm" onClick={recarregar} title="Recarregar quadro">
          <Icon name="refresh" size={14} /> Recarregar
        </button>
      </div>

      {colunas.length > 0 && (
        <KanbanFilterBar filtros={filtros} onChange={aplicarFiltros} usuarios={usuarios} />
      )}

      {colunas.length === 0 ? (
        <div className="empty">
          <Icon name="shuffle" size={36} stroke={1.4} />
          <h3>Este plano ainda não tem colunas</h3>
          <p>Crie a primeira coluna acima para começar a organizar os cards.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setArrastando(active.id)}
          onDragCancel={() => setArrastando(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="kp-board-wrap">
            <div className="kp-board" aria-label="Quadro Kanban">
              {colunas.map((coluna) => {
                const cardsDaColuna = cards[coluna.id] || [];
                return (
                  <KanbanColumn
                    key={coluna.id}
                    coluna={coluna}
                    cards={cardsDaColuna}
                    cardsExibidos={cardsDaColuna.filter((c) => cardPassaNosFiltros(c, filtros))}
                    usuariosPorId={usuariosPorId}
                    onCriarCard={criarCard}
                    onRenomear={renomearColuna}
                    onExcluir={excluirColuna}
                    onAbrirCard={setCardAberto}
                  />
                );
              })}
            </div>
          </div>
          <DragOverlay>{cardArrastado ? <KanbanCard card={cardArrastado} overlay /> : null}</DragOverlay>
        </DndContext>
      )}

      {cardAberto && (
        <CardModal
          card={cardAberto}
          usuarios={usuarios}
          onClose={() => setCardAberto(null)}
          onSalvo={(card) => { setCards((atual) => comCard(atual, card)); setCardAberto(null); }}
          onExcluido={(cardId) => { setCards((atual) => semCard(atual, cardId)); setCardAberto(null); }}
          onToast={onToast}
        />
      )}
    </>
  );
}
