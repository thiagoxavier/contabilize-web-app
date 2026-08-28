import { Icon } from '../../../components/icons';
import KanbanBoard from '../../../components/kanban/KanbanBoard';

/** Página do quadro de um plano. `plano` vem da lista já carregada no App. */
export default function KanbanBoardPage({ plano, onVoltar, onToast }) {
  if (!plano) {
    return (
      <div className="page">
        <div className="empty">
          <Icon name="alert" size={36} stroke={1.4} />
          <h3>Plano não encontrado</h3>
          <p>Ele pode ter sido excluído por outro usuário.</p>
          <button className="btn secondary" onClick={onVoltar}>Voltar para os planos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{plano.nome}</h1>
          {plano.descricao && <p className="subtitle">{plano.descricao}</p>}
        </div>
        <div className="page-header-actions">
          <button className="btn secondary" onClick={onVoltar}>
            <Icon name="chevLeft" size={14} /> Todos os planos
          </button>
        </div>
      </div>
      <KanbanBoard planoId={plano.id} onToast={onToast} />
    </div>
  );
}
