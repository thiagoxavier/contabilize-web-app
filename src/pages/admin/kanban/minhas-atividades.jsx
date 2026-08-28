import { useState, useEffect, useMemo } from 'react';
import { Icon } from '../../../components/icons';
import { usuariosApi } from '../../../utils/usuariosApi';
import { useMinhasAtividades } from '../../../hooks/useMinhasAtividades';
import CardModal from '../../../components/kanban/CardModal';
import '../../../components/kanban/kanban.css';

const PRIORIDADE = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

function hojeYmd() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

function formatarData(iso) {
  // dueDate vem como "AAAA-MM-DD" (DateOnly); evitar deslocamento de fuso.
  const [a, m, d] = String(iso).split('-');
  return `${d}/${m}/${a}`;
}

function grupoDe(dueDate, hoje) {
  if (!dueDate) return 'semPrazo';
  if (dueDate < hoje) return 'atrasadas';
  if (dueDate === hoje) return 'hoje';
  return 'proximas';
}

const GRUPOS = [
  { chave: 'atrasadas', titulo: 'Atrasadas' },
  { chave: 'hoje', titulo: 'Hoje' },
  { chave: 'proximas', titulo: 'Próximas' },
  { chave: 'semPrazo', titulo: 'Sem prazo' },
];

/**
 * "Minhas Atividades" — cards do Kanban Multi-Planos agregados entre todos os planos,
 * agrupados por prazo, com ação de mover o card sem precisar abrir o quadro original.
 */
export default function MinhasAtividadesPage({ onToast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [cliente, setCliente] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [dataDe, setDataDe] = useState('');
  const [dataAte, setDataAte] = useState('');
  const [atividadeAberta, setAtividadeAberta] = useState(null);

  useEffect(() => {
    usuariosApi.listarUsuarios()
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => {
        // Sem lista de usuários, o seletor "Ver atividades de" fica só com "Minhas atividades".
      });
  }, []);

  const { atividades, colunasPorPlano, loading, erro, recarregar, moverAtividade } =
    useMinhasAtividades(true, assigneeId);

  const clientes = useMemo(
    () => [...new Set(atividades.flatMap((a) => a.tags || []))].sort((a, b) => a.localeCompare(b)),
    [atividades]
  );

  const atividadesFiltradas = useMemo(() => atividades.filter((a) =>
    (!cliente || (a.tags || []).includes(cliente)) &&
    (!prioridade || a.prioridade === prioridade) &&
    (!dataDe || (a.dueDate && a.dueDate >= dataDe)) &&
    (!dataAte || (a.dueDate && a.dueDate <= dataAte))
  ), [atividades, cliente, prioridade, dataDe, dataAte]);

  const filtrosAtivos = Boolean(cliente || prioridade || dataDe || dataAte);
  const limparFiltros = () => { setCliente(''); setPrioridade(''); setDataDe(''); setDataAte(''); };

  const hoje = hojeYmd();
  const grupos = useMemo(() => {
    const porGrupo = { atrasadas: [], hoje: [], proximas: [], semPrazo: [] };
    for (const a of atividadesFiltradas) porGrupo[grupoDe(a.dueDate, hoje)].push(a);
    return porGrupo;
  }, [atividadesFiltradas, hoje]);

  const mover = async (atividade, novaColunaId) => {
    if (novaColunaId === atividade.colunaId) return;
    const colunas = colunasPorPlano[atividade.planoId] || [];
    const novaColuna = colunas.find((c) => c.id === novaColunaId);
    try {
      await moverAtividade(atividade.cardId, novaColunaId, novaColuna?.nome || '');
      onToast?.(`"${atividade.titulo}" movido para "${novaColuna?.nome || 'outra coluna'}".`);
    } catch (err) {
      onToast?.(err.message || 'Não foi possível mover o card.');
    }
  };

  const fecharModal = () => setAtividadeAberta(null);
  const aoSalvarAtividade = () => { fecharModal(); recarregar(); };
  const aoExcluirAtividade = () => { fecharModal(); recarregar(); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Minhas Atividades</h1>
          <p className="subtitle">Cards de todos os planos em um só lugar — sem precisar abrir cada quadro.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn ghost btn-sm" onClick={recarregar} title="Recarregar atividades">
            <Icon name="refresh" size={14} /> Recarregar
          </button>
        </div>
      </div>

      <div className="kp-filterbar" role="search" aria-label="Filtrar atividades">
        <div className="kp-filterbar-field">
          <label htmlFor="ma-assignee">Ver atividades de</label>
          <select id="ma-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Minhas atividades</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
        <div className="kp-filterbar-field">
          <label htmlFor="ma-cliente">Cliente</label>
          <select id="ma-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)}>
            <option value="">Todos</option>
            {clientes.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="kp-filterbar-field">
          <label htmlFor="ma-prioridade">Criticidade</label>
          <select id="ma-prioridade" value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div className="kp-filterbar-field">
          <label htmlFor="ma-data-de">De</label>
          <input id="ma-data-de" type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)} />
        </div>
        <div className="kp-filterbar-field">
          <label htmlFor="ma-data-ate">Até</label>
          <input id="ma-data-ate" type="date" value={dataAte} onChange={(e) => setDataAte(e.target.value)} />
        </div>
        {filtrosAtivos && (
          <button className="btn ghost btn-sm kp-filterbar-clear" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty"><h3>Carregando atividades…</h3></div>
      ) : erro ? (
        <div className="empty">
          <Icon name="alert" size={36} stroke={1.4} />
          <h3>Não foi possível carregar as atividades</h3>
          <p>{erro}</p>
          <button className="btn secondary" onClick={recarregar}>Tentar novamente</button>
        </div>
      ) : atividades.length === 0 ? (
        <div className="empty">
          <Icon name="clock" size={36} stroke={1.4} />
          <h3>Nenhuma atividade encontrada</h3>
          <p>Não há cards atribuídos {assigneeId ? 'a este usuário' : 'a você'} em nenhum plano.</p>
        </div>
      ) : atividadesFiltradas.length === 0 ? (
        <div className="empty">
          <Icon name="clock" size={36} stroke={1.4} />
          <h3>Nenhuma atividade encontrada</h3>
          <p>Nenhuma atividade corresponde aos filtros selecionados.</p>
          <button className="btn secondary" onClick={limparFiltros}>Limpar filtros</button>
        </div>
      ) : (
        GRUPOS.map(({ chave, titulo }) => {
          const itens = grupos[chave];
          if (itens.length === 0) return null;
          return (
            <section key={chave} className="ma-grupo">
              <h2 className={`ma-grupo-titulo${chave === 'atrasadas' ? ' ma-atrasado' : ''}`}>
                {titulo} <span className="kp-count">{itens.length}</span>
              </h2>
              <div className="card">
                <table className="table ma-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Cliente</th>
                      <th>Plano / Coluna</th>
                      <th>Prazo</th>
                      <th>Prioridade</th>
                      <th>Mover para</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((a) => {
                      const prio = PRIORIDADE[a.prioridade] ? a.prioridade : 'media';
                      const colunas = colunasPorPlano[a.planoId] || [];
                      return (
                        <tr key={a.cardId} className="ma-row" onClick={() => setAtividadeAberta(a)}>
                          <td>
                            <div className="kp-card-title">{a.titulo}</div>
                            {a.descricao && <div className="kp-card-desc">{a.descricao}</div>}
                          </td>
                          <td>
                            {a.tags?.length > 0 && (
                              <div className="kp-tags">{a.tags.map((t) => <span key={t} className="kp-tag">{t}</span>)}</div>
                            )}
                          </td>
                          <td>{a.planoNome} → {a.colunaNome}</td>
                          <td>
                            {a.dueDate ? (
                              <span className={a.dueDate < hoje ? 'kp-atrasado' : undefined}>
                                <Icon name="clock" size={12} /> {formatarData(a.dueDate)}
                              </span>
                            ) : '—'}
                          </td>
                          <td><span className={`kp-prio ${prio}`}>{PRIORIDADE[prio]}</span></td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <label className="sr-only" htmlFor={`ma-mover-${a.cardId}`}>Mover "{a.titulo}" para</label>
                            <select
                              id={`ma-mover-${a.cardId}`}
                              value={a.colunaId}
                              onChange={(e) => mover(a, e.target.value)}
                            >
                              {colunas.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}

      {atividadeAberta && (
        <CardModal
          card={{ ...atividadeAberta, id: atividadeAberta.cardId }}
          usuarios={usuarios}
          onClose={fecharModal}
          onSalvo={aoSalvarAtividade}
          onExcluido={aoExcluirAtividade}
          onToast={onToast}
        />
      )}
    </div>
  );
}
