import { useState } from 'react';
import { Icon } from './icons';
import { EtapaColumn } from './EtapaColumn';
import { useKanban } from '../contexts/KanbanContext';

const LIMITE_NOME = 255;

function agruparPassosPorEtapa(passos) {
  const mapa = {};
  for (const passo of passos) {
    if (!mapa[passo.etapaId]) mapa[passo.etapaId] = [];
    mapa[passo.etapaId].push(passo);
  }
  for (const lista of Object.values(mapa)) {
    lista.sort((a, b) => (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0));
  }
  return mapa;
}

/**
 * KanbanBoard — orquestra o board completo (PRD-KANBAN §5.1/§5.4).
 *
 * É o único dos três componentes que fala com o <KanbanContext/> (aprovado no
 * componente anterior deste fluxo): lê `etapas`/`passos`/`loading`/`erro` e
 * chama as ações (`moverPasso`, `criarPasso`, `criarEtapa`, `editarEtapa`,
 * `deletarEtapa`). <EtapaColumn/> e <PassoCard/> permanecem controlados por
 * props para ficarem testáveis isoladamente.
 *
 * Drag-and-drop: síncrono (PRD §5.3/§8) — o card só "muda de coluna" quando o
 * `moverPasso` do contexto resolve com sucesso, porque o agrupamento por
 * coluna é derivado direto de `passos` do contexto. Se a chamada falhar, o
 * estado nunca mudou, então não há nada para "desfazer" visualmente — o
 * rollback é uma consequência do fluxo síncrono, não uma etapa extra.
 *
 * Props:
 *   podeGerenciarEtapas: bool — libera criar/renomear/excluir Etapa (regra de
 *     negócio: Corretor vê Etapas somente-leitura; Gerente/Admin têm CRUD
 *     completo — RULES.md/PRD §4.4). Quem chama decide isso a partir das
 *     roles do JWT; este componente só respeita a flag.
 *   onClickPasso(passo): opcional — chamado ao abrir o detalhe de um passo
 *     (integra com o futuro <PassoModal/>, fora do escopo deste componente).
 */
export function KanbanBoard({ podeGerenciarEtapas = false, onClickPasso }) {
  const { etapas, passos, loading, erro, moverPasso, criarPasso, criarEtapa, editarEtapa, deletarEtapa } = useKanban();

  const [movingPassoId, setMovingPassoId] = useState(null);
  // Guarda o texto do último erro já dispensado pelo usuário — derivado
  // durante a renderização (sem useEffect) para reabrir o banner sempre que
  // uma nova falha diferente chegar do contexto.
  const [erroDispensado, setErroDispensado] = useState(null);
  const [showAddEtapa, setShowAddEtapa] = useState(false);
  const [nomeEtapa, setNomeEtapa] = useState('');
  const [erroEtapa, setErroEtapa] = useState(null);

  const erroVisivel = erro && erro !== erroDispensado ? erro : null;

  async function handleMoverPasso(passoId, novaEtapaId) {
    const passoAtual = passos.find((p) => p.id === passoId);
    if (!passoAtual || passoAtual.etapaId === novaEtapaId) return;
    setMovingPassoId(passoId);
    try {
      await moverPasso(passoId, novaEtapaId);
    } catch {
      // Erro já fica exposto em `erro` (contexto) e renderizado no banner
      // abaixo — nenhuma ação de rollback extra é necessária aqui.
    } finally {
      setMovingPassoId(null);
    }
  }

  async function handleCriarPasso(etapaId, titulo) {
    try {
      await criarPasso(etapaId, titulo, '');
    } catch {
      // erro exposto via contexto
    }
  }

  async function handleEditarEtapa(etapaId, novoNome) {
    try {
      await editarEtapa(etapaId, novoNome);
    } catch {
      // erro exposto via contexto
    }
  }

  async function handleDeletarEtapa(etapaId) {
    try {
      await deletarEtapa(etapaId);
    } catch {
      // erro exposto via contexto
    }
  }

  function handleSubmitEtapa(e) {
    e.preventDefault();
    const nome = nomeEtapa.trim();
    if (!nome) {
      setErroEtapa('Nome é obrigatório.');
      return;
    }
    if (nome.length > LIMITE_NOME) {
      setErroEtapa(`Nome deve ter no máximo ${LIMITE_NOME} caracteres.`);
      return;
    }
    setErroEtapa(null);
    criarEtapa(nome).catch(() => {});
    setNomeEtapa('');
    setShowAddEtapa(false);
  }

  const etapasOrdenadas = [...etapas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const passosPorEtapa = agruparPassosPorEtapa(passos);

  const carregandoInicial = loading && etapas.length === 0;

  return (
    // `data-kb-focus-anchor` + tabIndex=-1: destino de foco ESTÁVEL (permanece
    // montado durante todo o ciclo de vida do board) para onde <EtapaColumn/>
    // e <PassoModal/> devolvem o foco quando o elemento que deveria reassumi-lo
    // foi desmontado (exclusão de Etapa/Passo) — evita que o foco caia no
    // <body> (WCAG 2.1 AA — 2.4.3 Ordem de Foco). Ver `utils/a11yFocus.js`.
    <div className="kb-board-wrap" data-kb-focus-anchor tabIndex={-1}>
      {erroVisivel && (
        <div className="kb-error-banner" role="alert">
          <span>{erroVisivel}</span>
          <button type="button" aria-label="Fechar mensagem de erro" onClick={() => setErroDispensado(erroVisivel)}>✕</button>
        </div>
      )}

      {carregandoInicial ? (
        <>
          {/* Equivalente textual ao esqueleto visual (aria-hidden) abaixo —
              anuncia o carregamento a leitores de tela. */}
          <p className="kb-sr-only" role="status">Carregando passos...</p>
          <div className="kb-board" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="kb-column">
                <div className="kb-skeleton-card" />
                <div className="kb-skeleton-card" />
                <div className="kb-skeleton-card" />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="kb-board">
          {etapasOrdenadas.length === 0 && !podeGerenciarEtapas && (
            <p className="kb-empty-hint">Nenhuma etapa cadastrada ainda.</p>
          )}

          {etapasOrdenadas.map((etapa) => (
            <EtapaColumn
              key={etapa.id}
              etapa={etapa}
              passos={passosPorEtapa[etapa.id] || []}
              etapasParaMover={etapasOrdenadas.filter((e) => e.id !== etapa.id).map((e) => ({ id: e.id, label: e.label }))}
              podeGerenciarEtapas={podeGerenciarEtapas}
              onMoverPasso={handleMoverPasso}
              onClickPasso={onClickPasso}
              onCriarPasso={handleCriarPasso}
              onEditarEtapa={handleEditarEtapa}
              onDeletarEtapa={handleDeletarEtapa}
              movingPassoId={movingPassoId}
              disabled={loading}
            />
          ))}

          {podeGerenciarEtapas && (
            <div className="kb-add-etapa-column">
              {showAddEtapa ? (
                <form className="kb-inline-form" onSubmit={handleSubmitEtapa}>
                  <input
                    className="kb-inline-input"
                    value={nomeEtapa}
                    maxLength={LIMITE_NOME}
                    autoFocus
                    placeholder="Nome da etapa"
                    aria-label="Nome da nova etapa"
                    onChange={(e) => { setNomeEtapa(e.target.value); setErroEtapa(null); }}
                  />
                  {erroEtapa && <span className="kb-field-error">{erroEtapa}</span>}
                  <div className="kb-inline-actions">
                    <button type="submit" className="kb-btn-primary-sm">Criar</button>
                    <button
                      type="button"
                      className="kb-btn-ghost-sm"
                      onClick={() => { setShowAddEtapa(false); setNomeEtapa(''); setErroEtapa(null); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" className="kb-add-etapa-btn" onClick={() => setShowAddEtapa(true)}>
                  <Icon name="plus" size={16} /> Nova etapa
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
