import { useEffect, useMemo, useRef, useState } from 'react';
import { useKanban } from '../contexts/KanbanContext';
import { usuariosApi } from '../utils/usuariosApi';

const DEBOUNCE_MS = 350;

/**
 * FilterBar — busca e filtros do board Kanban (PRD-KANBAN §2.3/§5.4).
 *
 * Fala direto com o <KanbanContext/> (mesmo padrão do <KanbanBoard/> aprovado):
 * lê `passos`/`filtros` e chama `aplicarFiltros()`/`limparFiltros()`. Não
 * recebe props — é autossuficiente, para poder ser posicionado livremente
 * acima do <KanbanBoard/> por quem montar a <KanbanPage/> (fora do escopo
 * deste componente).
 *
 * - Busca por texto: debounced (evita 1 requisição por tecla digitada).
 * - Tag: opções derivadas das tags já presentes nos passos carregados — não
 *   existe endpoint dedicado de "listar tags" (evita inventar contrato do
 *   outro lado; ver CLAUDE.md raiz, "Regras de ouro").
 * - Responsável: opções vêm de GET /Usuarios (mesmo endpoint que o
 *   <PassoModal/> usa para o seletor de responsável, e que ClientesPage já
 *   consome — não é restrito a Administrador).
 */
export function FilterBar() {
  const { passos, filtros, aplicarFiltros, limparFiltros } = useKanban();

  const [busca, setBusca] = useState(filtros.busca || '');
  const [usuarios, setUsuarios] = useState([]);

  const debounceRef = useRef(null);

  useEffect(() => {
    usuariosApi.listarUsuarios()
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => {
        // Falha ao carregar responsáveis não deve travar busca/tag: o
        // dropdown de responsável simplesmente fica só com "Todos".
      });
  }, []);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const tagsDisponiveis = useMemo(() => {
    const unicas = new Set();
    for (const passo of passos) {
      for (const tag of Array.isArray(passo.tags) ? passo.tags : []) {
        unicas.add(tag);
      }
    }
    return Array.from(unicas).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [passos]);

  const temFiltroAtivo = Boolean(busca || filtros.tag || filtros.responsavelId);

  const contagemPassos = passos.length;
  const textoContagem = contagemPassos === 1
    ? '1 passo encontrado.'
    : `${contagemPassos} passos encontrados.`;

  function handleBuscaChange(valor) {
    setBusca(valor);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      aplicarFiltros({ busca: valor }).catch(() => {
        // erro já exposto via contexto (banner do KanbanBoard)
      });
    }, DEBOUNCE_MS);
  }

  function handleTagChange(e) {
    aplicarFiltros({ tag: e.target.value }).catch(() => {});
  }

  function handleResponsavelChange(e) {
    aplicarFiltros({ responsavelId: e.target.value || null }).catch(() => {});
  }

  function handleLimpar() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setBusca('');
    limparFiltros().catch(() => {});
  }

  return (
    <div className="kb-filterbar" role="search" aria-label="Filtrar passos do Kanban">
      <div className="kb-filterbar-search">
        <label htmlFor="kb-filterbar-busca" className="kb-sr-only">Buscar por título ou descrição</label>
        <input
          id="kb-filterbar-busca"
          type="search"
          className="kb-filterbar-input"
          placeholder="Buscar por título ou descrição..."
          value={busca}
          onChange={(e) => handleBuscaChange(e.target.value)}
        />
      </div>

      <div className="kb-filterbar-field">
        <label htmlFor="kb-filterbar-tag">Tag</label>
        <select id="kb-filterbar-tag" value={filtros.tag || ''} onChange={handleTagChange}>
          <option value="">Todas as tags</option>
          {tagsDisponiveis.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <div className="kb-filterbar-field">
        <label htmlFor="kb-filterbar-responsavel">Responsável</label>
        <select id="kb-filterbar-responsavel" value={filtros.responsavelId || ''} onChange={handleResponsavelChange}>
          <option value="">Todos os responsáveis</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn ghost btn-sm kb-filterbar-clear"
        onClick={handleLimpar}
        disabled={!temFiltroAtivo}
      >
        Limpar filtros
      </button>

      {/* Anuncia a leitores de tela o resultado de filtros aplicados de forma
          assíncrona (busca debounced, tag, responsável) — visualmente oculto. */}
      <p className="kb-sr-only" role="status" aria-live="polite">{textoContagem}</p>
    </div>
  );
}
