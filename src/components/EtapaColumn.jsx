import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { PassoCard } from './PassoCard';
import { aplicarFocusTrap, focarElementoOuFallback } from '../utils/a11yFocus';

const LIMITE_NOME = 255;
const MENUITEM_SELECTOR = '[role="menuitem"]';

/**
 * EtapaColumn — uma coluna do board (PRD-KANBAN §5.4). Puramente controlada
 * por props, como <PassoCard/>: quem fala com a API é o <KanbanBoard/>.
 *
 * Regra de negócio (RULES.md / PRD §4.4): Corretor tem Etapas somente-leitura;
 * Gerente/Admin têm CRUD completo. `podeGerenciarEtapas` chega já calculado
 * pelo chamador (com base nas roles do JWT) — este componente não decide RBAC,
 * só respeita a flag.
 *
 * Props:
 *   etapa: EtapaDto { id, label, ordem, ... }
 *   passos: PassoDto[] — já filtrados/ordenados para esta etapa
 *   etapasParaMover: Array<{ id, label }> — demais etapas, para o "Mover para" dos cards
 *   podeGerenciarEtapas: bool — libera renomear/excluir a etapa
 *   onMoverPasso(passoId, novaEtapaId)
 *   onClickPasso(passo)
 *   onCriarPasso(etapaId, titulo)
 *   onEditarEtapa(etapaId, novoNome)
 *   onDeletarEtapa(etapaId)
 *   movingPassoId: string|null — id do passo em transição (spinner + disable)
 *   disabled: bool — desabilita ações de escrita da coluna (ex.: uma chamada já em andamento)
 */
export function EtapaColumn({
  etapa,
  passos = [],
  etapasParaMover = [],
  podeGerenciarEtapas = false,
  onMoverPasso,
  onClickPasso,
  onCriarPasso,
  onEditarEtapa,
  onDeletarEtapa,
  movingPassoId = null,
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [showAddPasso, setShowAddPasso] = useState(false);
  const [tituloPasso, setTituloPasso] = useState('');
  const [erroPasso, setErroPasso] = useState(null);

  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [nomeEdit, setNomeEdit] = useState(etapa.label);
  const [erroEdit, setErroEdit] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menuBtnRef = useRef(null);
  const menuRef = useRef(null);
  const menuWrapRef = useRef(null);
  const confirmBoxRef = useRef(null);

  // Padrão de teclado de um menu ARIA (WAI-ARIA Authoring Practices — "menu"):
  // ao abrir, o foco vai para o primeiro item.
  useEffect(() => {
    if (showMenu && menuRef.current) {
      menuRef.current.querySelector(MENUITEM_SELECTOR)?.focus();
    }
  }, [showMenu]);

  // Fecha o menu ao clicar fora dele (o handler de blur cobre a saída por teclado/Tab).
  useEffect(() => {
    if (!showMenu) return undefined;
    function handleClickFora(e) {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [showMenu]);

  // Move o foco para o primeiro botão da caixa de confirmação ao abri-la
  // (contrato de alertdialog — WAI-ARIA Authoring Practices).
  useEffect(() => {
    if (confirmDelete && confirmBoxRef.current) {
      confirmBoxRef.current.querySelector('button')?.focus();
    }
  }, [confirmDelete]);

  function closeMenu() {
    setShowMenu(false);
    menuBtnRef.current?.focus();
  }

  function handleMenuWrapBlur(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setShowMenu(false);
    }
  }

  function handleMenuKeyDown(e) {
    const itens = Array.from(menuRef.current?.querySelectorAll(MENUITEM_SELECTOR) || []);
    if (itens.length === 0) return;
    const indiceAtual = itens.indexOf(document.activeElement);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        itens[(indiceAtual + 1) % itens.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        itens[(indiceAtual - 1 + itens.length) % itens.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        itens[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        itens[itens.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      default:
        break;
    }
  }

  function handleCancelarExclusaoEtapa() {
    setConfirmDelete(false);
    menuBtnRef.current?.focus();
  }

  function handleConfirmBoxKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelarExclusaoEtapa();
      return;
    }
    // Focus trap real do alertdialog (WCAG 2.1 AA — 2.4.3): Tab/Shift+Tab
    // ficam contidos nos botões Excluir/Cancelar, sem escapar para outros
    // controles da coluna ou de outras colunas.
    aplicarFocusTrap(confirmBoxRef.current, e);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOver) setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const passoId = e.dataTransfer.getData('text/plain');
    if (passoId) {
      onMoverPasso?.(passoId, etapa.id);
    }
  }

  function validarNome(valor) {
    const nome = valor.trim();
    if (!nome) return 'Nome é obrigatório.';
    if (nome.length > LIMITE_NOME) return `Nome deve ter no máximo ${LIMITE_NOME} caracteres.`;
    return null;
  }

  function handleSubmitPasso(e) {
    e.preventDefault();
    const erro = validarNome(tituloPasso);
    if (erro) {
      setErroPasso(erro);
      return;
    }
    setErroPasso(null);
    onCriarPasso?.(etapa.id, tituloPasso.trim());
    setTituloPasso('');
    setShowAddPasso(false);
  }

  function handleSubmitEdit(e) {
    e.preventDefault();
    const erro = validarNome(nomeEdit);
    if (erro) {
      setErroEdit(erro);
      return;
    }
    setErroEdit(null);
    onEditarEtapa?.(etapa.id, nomeEdit.trim());
    setShowEdit(false);
    setShowMenu(false);
  }

  function handleConfirmarExclusao() {
    const resultadoExclusao = onDeletarEtapa?.(etapa.id);
    setConfirmDelete(false);
    setShowMenu(false);
    // Diferente do cancelamento (que refoca o botão "Mais ações" desta
    // mesma coluna), uma exclusão bem-sucedida desmonta a coluna inteira —
    // não há elemento próprio para devolver o foco. Assim que a exclusão
    // resolver, move o foco para um destino ESTÁVEL fora da coluna (ver
    // `FOCUS_ANCHOR_SELECTOR`), em vez de deixá-lo cair no <body>
    // (WCAG 2.1 AA — 2.4.3 Ordem de Foco).
    Promise.resolve(resultadoExclusao).then(() => {
      focarElementoOuFallback(null);
    });
  }

  return (
    <div
      className={`kb-column${dragOver ? ' kb-column-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label={`Etapa ${etapa.label}`}
    >
      <div className="kb-column-head">
        {showEdit ? (
          <form className="kb-inline-form" onSubmit={handleSubmitEdit} style={{ flex: 1 }}>
            <input
              className="kb-inline-input"
              value={nomeEdit}
              maxLength={LIMITE_NOME}
              autoFocus
              aria-label="Novo nome da etapa"
              onChange={(e) => { setNomeEdit(e.target.value); setErroEdit(null); }}
            />
            {erroEdit && <span className="kb-field-error">{erroEdit}</span>}
            <div className="kb-inline-actions">
              <button type="submit" className="kb-icon-btn-sm" aria-label="Salvar nome da etapa">
                <Icon name="check" size={14} />
              </button>
              <button
                type="button"
                className="kb-icon-btn-sm"
                aria-label="Cancelar edição"
                onClick={() => { setShowEdit(false); setNomeEdit(etapa.label); setErroEdit(null); }}
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="kb-column-title-wrap">
              <span className="kb-column-title">{etapa.label}</span>
              <span className="kb-badge-count">{passos.length}</span>
            </div>
            <div className="kb-column-actions">
              <button
                type="button"
                className="kb-icon-btn-sm"
                aria-label={`Adicionar passo em ${etapa.label}`}
                onClick={() => setShowAddPasso((v) => !v)}
                disabled={disabled}
              >
                <Icon name="plus" size={15} />
              </button>
              {podeGerenciarEtapas && (
                <div className="kb-menu-wrap" ref={menuWrapRef} onBlur={handleMenuWrapBlur}>
                  <button
                    type="button"
                    ref={menuBtnRef}
                    className="kb-icon-btn-sm"
                    aria-label={`Mais ações da etapa ${etapa.label}`}
                    aria-haspopup="menu"
                    aria-expanded={showMenu}
                    onClick={() => setShowMenu((v) => !v)}
                    disabled={disabled}
                  >
                    <Icon name="more" size={15} />
                  </button>
                  {showMenu && (
                    <div className="kb-menu" role="menu" ref={menuRef} onKeyDown={handleMenuKeyDown}>
                      <button
                        type="button"
                        role="menuitem"
                        className="kb-menu-item"
                        onClick={() => { setShowEdit(true); setShowMenu(false); }}
                      >
                        <Icon name="edit" size={14} /> Renomear
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="kb-menu-item kb-menu-item-danger"
                        onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                      >
                        <Icon name="trash" size={14} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {confirmDelete && (
        <div
          className="kb-confirm-box"
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirmar exclusão da etapa"
          ref={confirmBoxRef}
          onKeyDown={handleConfirmBoxKeyDown}
        >
          <p>Excluir "{etapa.label}"? Os passos serão movidos para a etapa anterior.</p>
          <div className="kb-inline-actions">
            <button type="button" className="kb-btn-danger-sm" onClick={handleConfirmarExclusao}>Excluir</button>
            <button type="button" className="kb-btn-ghost-sm" onClick={handleCancelarExclusaoEtapa}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="kb-cards" role="list" aria-label={`Passos da etapa ${etapa.label}`}>
        {passos.length === 0 && !showAddPasso && (
          <p className="kb-empty-hint" role="listitem">Nenhum passo nesta etapa. Arraste um card aqui ou use "+".</p>
        )}
        {passos.map((passo) => (
          <PassoCard
            key={passo.id}
            passo={passo}
            etapasDisponiveis={etapasParaMover}
            onMover={(novaEtapaId) => onMoverPasso?.(passo.id, novaEtapaId)}
            onClick={() => onClickPasso?.(passo)}
            disabled={disabled}
            isMoving={movingPassoId === passo.id}
          />
        ))}
      </div>

      {showAddPasso ? (
        <form className="kb-inline-form" onSubmit={handleSubmitPasso}>
          <input
            className="kb-inline-input"
            value={tituloPasso}
            maxLength={LIMITE_NOME}
            autoFocus
            placeholder="Título do passo"
            aria-label={`Título do novo passo em ${etapa.label}`}
            onChange={(e) => { setTituloPasso(e.target.value); setErroPasso(null); }}
          />
          {erroPasso && <span className="kb-field-error">{erroPasso}</span>}
          <div className="kb-inline-actions">
            <button type="submit" className="kb-btn-primary-sm" disabled={disabled}>Adicionar</button>
            <button
              type="button"
              className="kb-btn-ghost-sm"
              onClick={() => { setShowAddPasso(false); setTituloPasso(''); setErroPasso(null); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="kb-add-passo-btn" onClick={() => setShowAddPasso(true)} disabled={disabled}>
          <Icon name="plus" size={14} /> Adicionar passo
        </button>
      )}
    </div>
  );
}
