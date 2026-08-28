import { useState } from 'react';
import { Icon } from '../../../components/icons';
import '../../../components/kanban/kanban.css';

/**
 * "Gerenciar planos" — lista os planos do Kanban Multi-Planos e permite criar
 * e excluir. Clicar em um plano abre o board dele. Os dados vêm do App
 * (hook usePlanos), que também alimenta o menu lateral.
 */
export default function KanbanPlanos({ planos, loading, erro, onCriar, onEditar, onDeletar, onAbrir, onRecarregar, onToast }) {
  const [mostraForm, setMostraForm] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edNome, setEdNome] = useState('');
  const [edDescricao, setEdDescricao] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const fecharForm = () => { setMostraForm(false); setNome(''); setDescricao(''); };

  const editar = (plano, e) => {
    e.stopPropagation();
    setEditandoId(plano.id);
    setEdNome(plano.nome);
    setEdDescricao(plano.descricao || '');
  };

  const cancelarEdicao = (e) => { e?.stopPropagation(); setEditandoId(null); };

  const salvarEdicao = async (plano, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!edNome.trim()) return;
    setSalvandoEdicao(true);
    try {
      await onEditar(plano.id, { nome: edNome.trim(), descricao: edDescricao.trim() || null });
      setEditandoId(null);
      onToast?.('Plano atualizado.');
    } catch (err) {
      onToast?.(err.message || 'Não foi possível atualizar o plano.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const criar = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const plano = await onCriar({ nome: nome.trim(), descricao: descricao.trim() || null });
      fecharForm();
      onToast?.(`Plano "${plano.nome}" criado.`);
    } catch (err) {
      onToast?.(err.message || 'Não foi possível criar o plano.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (plano, e) => {
    e.stopPropagation();
    if (!window.confirm(`Excluir o plano "${plano.nome}"? Todas as colunas e cards dele serão apagados.`)) return;
    try {
      await onDeletar(plano.id);
      onToast?.(`Plano "${plano.nome}" excluído.`);
    } catch (err) {
      onToast?.(err.message || 'Não foi possível excluir o plano.');
    }
  };

  const formatarData = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Planos</h1>
          <p className="subtitle">Cada plano é um quadro Kanban independente (sprint, roadmap, projeto interno…). Escolha um plano para abrir o quadro.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn primary" onClick={() => setMostraForm((v) => !v)}>
            <Icon name="plus" size={14} /> Novo plano
          </button>
        </div>
      </div>

      {mostraForm && (
        <form className="card kp-form-card" onSubmit={criar}>
          <div className="field-group">
            <label htmlFor="kp-plano-nome">Nome do plano</label>
            <input id="kp-plano-nome" autoFocus required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Sprint 12, Roadmap 2026" />
          </div>
          <div className="field-group">
            <label htmlFor="kp-plano-desc">Descrição (opcional)</label>
            <textarea id="kp-plano-desc" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Objetivo deste plano" />
          </div>
          <div className="kp-form-actions">
            <button type="button" className="btn ghost" onClick={fecharForm}>Cancelar</button>
            <button type="submit" className="btn primary" disabled={salvando || !nome.trim()}>{salvando ? 'Criando…' : 'Criar plano'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="empty"><h3>Carregando planos…</h3></div>
      ) : erro ? (
        <div className="empty">
          <Icon name="alert" size={36} stroke={1.4} />
          <h3>Não foi possível carregar os planos</h3>
          <p>{erro}</p>
          <button className="btn secondary" onClick={onRecarregar}>Tentar novamente</button>
        </div>
      ) : planos.length === 0 ? (
        <div className="empty">
          <Icon name="chart" size={36} stroke={1.4} />
          <h3>Nenhum plano criado</h3>
          <p>Crie o primeiro plano para começar a usar o Kanban.</p>
          <button className="btn primary" onClick={() => setMostraForm(true)}><Icon name="plus" size={14} /> Criar primeiro plano</button>
        </div>
      ) : (
        <div className="kp-planos-grid">
          {planos.map((plano) => {
            const emEdicao = editandoId === plano.id;
            return (
              <div
                key={plano.id}
                className="kp-plano"
                role="button"
                tabIndex={0}
                onClick={() => { if (!emEdicao) onAbrir(plano.id); }}
                onKeyDown={(e) => { if (!emEdicao && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onAbrir(plano.id); } }}
              >
                {emEdicao ? (
                  <form className="kp-form-edicao" onClick={(e) => e.stopPropagation()} onSubmit={(e) => salvarEdicao(plano, e)}>
                    <div className="field-group">
                      <label htmlFor={`kp-ed-nome-${plano.id}`}>Nome do plano</label>
                      <input id={`kp-ed-nome-${plano.id}`} autoFocus required value={edNome} onChange={(e) => setEdNome(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label htmlFor={`kp-ed-desc-${plano.id}`}>Descrição (opcional)</label>
                      <textarea id={`kp-ed-desc-${plano.id}`} rows={2} value={edDescricao} onChange={(e) => setEdDescricao(e.target.value)} />
                    </div>
                    <div className="kp-form-actions">
                      <button type="button" className="btn ghost" onClick={cancelarEdicao}>Cancelar</button>
                      <button type="submit" className="btn primary" disabled={salvandoEdicao || !edNome.trim()}>{salvandoEdicao ? 'Salvando…' : 'Salvar'}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="kp-plano-head">
                      <h3>{plano.nome}</h3>
                      <div className="kp-plano-acoes">
                        <button className="kp-icon-btn" onClick={(e) => editar(plano, e)} title="Editar plano" aria-label={`Editar plano ${plano.nome}`}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="kp-icon-btn danger" onClick={(e) => excluir(plano, e)} title="Excluir plano" aria-label={`Excluir plano ${plano.nome}`}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                    <p>{plano.descricao || 'Sem descrição'}</p>
                    <div className="kp-plano-foot">
                      <span>Criado em {formatarData(plano.criadoEm)}</span>
                      <strong>Abrir quadro →</strong>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
