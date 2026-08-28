import { Icon } from '../icons';

/**
 * Filtros do board de um Plano (Kanban Multi-Planos): prioridade, prazo (intervalo
 * de/até) e responsável. Puramente client-side — o board já carrega todos os cards
 * do plano de uma vez (ver `useKanban`), então não há necessidade de um novo
 * parâmetro de busca na API.
 */
export default function KanbanFilterBar({ filtros, onChange, usuarios = [] }) {
  const temFiltroAtivo = Boolean(
    filtros.prioridade || filtros.responsavelId || filtros.prazoDe || filtros.prazoAte
  );

  const limpar = () => onChange({ prioridade: '', responsavelId: '', prazoDe: '', prazoAte: '' });

  return (
    <div className="kp-filterbar" role="search" aria-label="Filtrar cards do quadro">
      <div className="kp-filterbar-field">
        <label htmlFor="kp-filtro-prioridade">Prioridade</label>
        <select
          id="kp-filtro-prioridade"
          value={filtros.prioridade}
          onChange={(e) => onChange({ prioridade: e.target.value })}
        >
          <option value="">Todas</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>

      <div className="kp-filterbar-field">
        <label htmlFor="kp-filtro-responsavel">Responsável</label>
        <select
          id="kp-filtro-responsavel"
          value={filtros.responsavelId}
          onChange={(e) => onChange({ responsavelId: e.target.value })}
        >
          <option value="">Todos</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      <div className="kp-filterbar-field">
        <label htmlFor="kp-filtro-prazo-de">Prazo de</label>
        <input
          id="kp-filtro-prazo-de"
          type="date"
          value={filtros.prazoDe}
          onChange={(e) => onChange({ prazoDe: e.target.value })}
        />
      </div>

      <div className="kp-filterbar-field">
        <label htmlFor="kp-filtro-prazo-ate">Prazo até</label>
        <input
          id="kp-filtro-prazo-ate"
          type="date"
          value={filtros.prazoAte}
          onChange={(e) => onChange({ prazoAte: e.target.value })}
        />
      </div>

      <button type="button" className="btn ghost btn-sm kp-filterbar-clear" onClick={limpar} disabled={!temFiltroAtivo}>
        <Icon name="filter" size={14} /> Limpar filtros
      </button>
    </div>
  );
}
