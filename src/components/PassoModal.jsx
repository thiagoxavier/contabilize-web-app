import { useEffect, useRef, useState } from 'react';
import { useKanban } from '../contexts/KanbanContext';
import { usuariosApi } from '../utils/usuariosApi';
import { aplicarFocusTrap, focarElementoOuFallback } from '../utils/a11yFocus';

const LIMITE_NOME = 255;

/**
 * PassoModal — modal de detalhe/edição de um Passo (PRD-KANBAN §5.4/§7).
 *
 * Abre quando `passo` não é nulo (o card do passo, no <KanbanBoard/> aprovado,
 * já chama `onClickPasso(passo)` com o objeto vindo do <KanbanContext/> — quem
 * hospedar este modal só precisa guardar esse objeto em estado e passá-lo aqui).
 *
 * Ao contrário de <PassoCard/>/<EtapaColumn/> (puramente controlados por
 * props), este componente fala direto com o <KanbanContext/> — mesmo padrão já
 * usado pelo <KanbanBoard/> aprovado — porque ele é o único lugar que orquestra
 * a chamada de rede para editar/deletar o passo em questão.
 *
 * Props:
 *   passo: PassoDto | null — quando null, o componente não renderiza nada.
 *   onClose(): fecha o modal (Cancelar, Esc, clique fora, ou após salvar/deletar).
 *   onToast(msg): opcional — mesmo padrão `onToast` usado em outras telas do
 *     portal (ClientesPage, etc.) para exibir sucesso/erro no <Toast/> global.
 *   onSalvo(passoAtualizado): opcional — chamado após salvar com sucesso.
 *   onDeletado(passoId): opcional — chamado após deletar com sucesso.
 */
export function PassoModal({ passo, onClose, onToast, onSalvo, onDeletado }) {
  const { editarPasso, deletarPasso } = useKanban();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [erroTitulo, setErroTitulo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [erroUsuarios, setErroUsuarios] = useState(null);

  const modalRef = useRef(null);
  const tituloInputRef = useRef(null);
  const confirmBoxRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  // Elemento que tinha o foco antes do modal abrir (o card/botão clicado) —
  // capturado no momento em que um passo NOVO é carregado (ver bloco abaixo),
  // antes de qualquer efeito mover o foco para dentro do modal. É devolvido a
  // ele em todos os caminhos de fechamento (WCAG 2.1 AA — 2.4.3 Ordem de Foco).
  const openerElementRef = useRef(null);

  // Reinicia o formulário sempre que um passo diferente é aberto — ajuste de
  // estado durante a renderização (não em useEffect) para evitar o
  // re-render em cascata que setState síncrono dentro de efeito causaria.
  const [passoIdCarregado, setPassoIdCarregado] = useState(null);
  if (passo && passo.id !== passoIdCarregado) {
    setPassoIdCarregado(passo.id);
    // Captura o elemento que abriu o modal antes que o efeito de foco inicial
    // (abaixo) o mova para o campo de título.
    openerElementRef.current = document.activeElement;
    setTitulo(passo.titulo || '');
    setDescricao(passo.descricao || '');
    setTags(Array.isArray(passo.tags) ? [...passo.tags] : []);
    setTagInput('');
    setResponsavelId(passo.responsavelId || '');
    setErroTitulo(null);
    setConfirmDelete(false);
  }

  // Carrega a lista de usuários do tenant para o seletor de responsável.
  useEffect(() => {
    if (!passo) return;
    let cancelado = false;
    usuariosApi.listarUsuarios()
      .then((data) => {
        if (cancelado) return;
        setUsuarios(Array.isArray(data) ? data : []);
        setErroUsuarios(null);
      })
      .catch((e) => {
        if (!cancelado) setErroUsuarios(e.message || 'Erro ao carregar responsáveis.');
      });
    return () => { cancelado = true; };
  }, [passo]);

  // Foco inicial no título ao abrir o modal — só quando um passo NOVO é
  // carregado (não deve roubar o foco de volta a cada toggle de confirmDelete).
  useEffect(() => {
    if (passoIdCarregado) tituloInputRef.current?.focus();
  }, [passoIdCarregado]);

  // Move o foco para o primeiro botão da caixa de confirmação de exclusão ao
  // abri-la (contrato de alertdialog — WAI-ARIA Authoring Practices).
  useEffect(() => {
    if (confirmDelete && confirmBoxRef.current) {
      confirmBoxRef.current.querySelector('button')?.focus();
    }
  }, [confirmDelete]);

  // Fechar com Esc (só a confirmação, se estiver aberta; senão o modal
  // inteiro) + focus trap (WCAG 2.1 AA).
  useEffect(() => {
    if (!passo) return;

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          e.stopPropagation();
          handleCancelarExclusao();
          return;
        }
        fecharModal();
        return;
      }
      aplicarFocusTrap(modalRef.current, e);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, confirmDelete]);

  if (!passo) return null;

  // Fecha o modal e devolve o foco a quem o abriu (WCAG 2.1 AA — 2.4.3). No
  // fluxo de EXCLUSÃO de um passo, o elemento que abriu o modal (o botão do
  // card na lista) é desmontado no mesmo commit que remove o passo — por
  // isso `focarElementoOuFallback` primeiro confirma que ele ainda está no
  // DOM antes de focá-lo, e cai para um destino estável (ver
  // `utils/a11yFocus.js`) quando ele já não existe mais.
  function fecharModal() {
    const elementoParaFocar = openerElementRef.current;
    onClose?.();
    focarElementoOuFallback(elementoParaFocar);
  }

  function handleCancelarExclusao() {
    setConfirmDelete(false);
    deleteTriggerRef.current?.focus();
  }

  const bloqueado = salvando || deletando;

  function validarTitulo(valor) {
    const nome = valor.trim();
    if (!nome) return 'Título é obrigatório.';
    if (nome.length > LIMITE_NOME) return `Título deve ter no máximo ${LIMITE_NOME} caracteres.`;
    return null;
  }

  function handleAdicionarTag() {
    const valor = tagInput.trim();
    if (!valor) return;
    if (!tags.includes(valor)) setTags((prev) => [...prev, valor]);
    setTagInput('');
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdicionarTag();
    }
  }

  function handleRemoverTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const erro = validarTitulo(titulo);
    if (erro) {
      setErroTitulo(erro);
      return;
    }
    setErroTitulo(null);
    setSalvando(true);
    try {
      const atualizado = await editarPasso(passo.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        responsavelId: responsavelId || null,
        tags,
      });
      onToast?.('Passo atualizado com sucesso.');
      onSalvo?.(atualizado);
      fecharModal();
    } catch (err) {
      onToast?.(err.message || 'Erro ao salvar passo.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar() {
    setDeletando(true);
    try {
      await deletarPasso(passo.id);
      onToast?.('Passo excluído com sucesso.');
      onDeletado?.(passo.id);
      fecharModal();
    } catch (err) {
      onToast?.(err.message || 'Erro ao excluir passo.');
    } finally {
      setDeletando(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="ae-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}>
      <div
        className="ae-modal kb-passo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passo-modal-titulo"
        ref={modalRef}
      >
        <div className="ae-modal-header">
          <h3 id="passo-modal-titulo">Editar passo</h3>
          <button type="button" className="ae-modal-close" aria-label="Fechar" onClick={fecharModal} disabled={bloqueado}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ae-modal-body">
            <div className="field-group">
              <label htmlFor="passo-modal-titulo-input">Título</label>
              <input
                id="passo-modal-titulo-input"
                ref={tituloInputRef}
                value={titulo}
                maxLength={LIMITE_NOME}
                onChange={(e) => { setTitulo(e.target.value); setErroTitulo(null); }}
                disabled={bloqueado}
                aria-invalid={erroTitulo ? 'true' : undefined}
                aria-describedby={erroTitulo ? 'passo-modal-titulo-erro' : undefined}
              />
              {erroTitulo && (
                <span id="passo-modal-titulo-erro" className="kb-field-error" role="alert">{erroTitulo}</span>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="passo-modal-descricao">Descrição</label>
              <textarea
                id="passo-modal-descricao"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={bloqueado}
              />
            </div>

            <div className="field-group">
              <label htmlFor="passo-modal-tag-input">Tags</label>
              {tags.length > 0 && (
                <ul className="kb-tagpicker-chips" aria-label="Tags adicionadas">
                  {tags.map((tag) => (
                    <li key={tag} className="kb-tagpicker-chip">
                      {tag}
                      <button
                        type="button"
                        className="kb-tagpicker-remove"
                        aria-label={`Remover tag ${tag}`}
                        onClick={() => handleRemoverTag(tag)}
                        disabled={bloqueado}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="kb-tagpicker-input-row">
                <input
                  id="passo-modal-tag-input"
                  value={tagInput}
                  placeholder="Digite e pressione Enter"
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={bloqueado}
                />
                <button
                  type="button"
                  className="btn ghost btn-sm"
                  onClick={handleAdicionarTag}
                  disabled={bloqueado || !tagInput.trim()}
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="passo-modal-responsavel">Responsável</label>
              <select
                id="passo-modal-responsavel"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                disabled={bloqueado || !!erroUsuarios}
              >
                <option value="">Sem responsável</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
              {erroUsuarios && <span className="kb-field-error">{erroUsuarios}</span>}
            </div>

            {confirmDelete && (
              <div
                className="kb-confirm-box"
                role="alertdialog"
                aria-modal="true"
                aria-label="Confirmar exclusão do passo"
                ref={confirmBoxRef}
              >
                <p>Excluir o passo &quot;{passo.titulo}&quot;? Essa ação não pode ser desfeita.</p>
                <div className="kb-inline-actions">
                  <button type="button" className="kb-btn-danger-sm" onClick={handleDeletar} disabled={bloqueado}>
                    {deletando ? 'Excluindo...' : 'Confirmar exclusão'}
                  </button>
                  <button type="button" className="kb-btn-ghost-sm" onClick={handleCancelarExclusao} disabled={bloqueado}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="ae-modal-footer">
            <button
              type="button"
              ref={deleteTriggerRef}
              className="btn danger btn-sm kb-passo-modal-delete"
              onClick={() => setConfirmDelete(true)}
              disabled={bloqueado}
            >
              Deletar
            </button>
            <button type="button" className="btn ghost btn-sm" onClick={fecharModal} disabled={bloqueado}>
              Cancelar
            </button>
            <button type="submit" className="btn primary btn-sm" disabled={bloqueado}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
