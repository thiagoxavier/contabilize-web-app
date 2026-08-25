/**
 * Utilitários de foco compartilhados pelos componentes do Kanban
 * (PRD-KANBAN §5.4/§7) para os requisitos de WCAG 2.1 AA — 2.1.2 (Sem
 * Armadilha de Teclado, ao contrário: aqui é a armadilha *intencional* de um
 * diálogo modal) e 2.4.3 (Ordem de Foco).
 *
 * Extraído para evitar duplicar a mesma lógica entre <EtapaColumn/> e
 * <PassoModal/> (CONVENTIONS.md §1 — "extraia lógica repetida para hook/util
 * antes de duplicar").
 */

/**
 * Seletor dos elementos "focáveis" considerados por um focus trap (usado
 * tanto pelo diálogo de confirmação de exclusão de Etapa quanto pelo
 * <PassoModal/>).
 */
export const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Contrato de "destino de foco estável": qualquer contêiner que permaneça
 * montado durante todo o ciclo de vida da tela do Kanban (ex.: o wrapper do
 * <KanbanBoard/>) pode se marcar com este atributo para servir de fallback
 * quando o elemento que deveria reassumir o foco (o "opener" de um modal, o
 * botão que abriu um menu, etc.) não existe mais no DOM — evitando que o
 * foco caia no <body> (WCAG 2.1 AA — 2.4.3 Ordem de Foco).
 */
export const FOCUS_ANCHOR_SELECTOR = '[data-kb-focus-anchor]';

/** Verdadeiro quando `elemento` ainda está no DOM (não foi desmontado). */
export function elementoAindaMontado(elemento) {
  return Boolean(elemento && elemento.isConnected);
}

/**
 * Foca `elemento` se ele ainda estiver montado; caso contrário (ex.: o card
 * de um Passo excluído, ou a coluna de uma Etapa excluída, que desmontam no
 * mesmo commit que remove o item da lista), foca o destino de foco estável
 * mais próximo (ver `FOCUS_ANCHOR_SELECTOR`) em vez de deixar o foco cair no
 * `<body>`.
 *
 * Adia a verificação para depois do commit corrente — no caminho real de
 * exclusão, o elemento ainda consta como conectado no exato instante
 * síncrono da chamada (a remoção da árvore só é aplicada quando o React de
 * fato "commita" o lote de atualizações agendado, o que acontece depois —
 * inclusive depois de qualquer microtask agendada aqui), então checar
 * imediatamente ou numa microtask daria um falso positivo: focaríamos um
 * elemento que está prestes a ser removido, e o foco cairia no `<body>`
 * igualmente quando a remoção realmente ocorrer. Um `setTimeout` (macrotask)
 * roda depois do commit.
 */
export function focarElementoOuFallback(elemento) {
  setTimeout(() => {
    if (elementoAindaMontado(elemento) && typeof elemento.focus === 'function') {
      elemento.focus();
      return;
    }
    document.querySelector(FOCUS_ANCHOR_SELECTOR)?.focus();
  }, 0);
}

/**
 * Focus trap de um diálogo: ao pressionar Tab no último elemento focável de
 * `container`, volta para o primeiro; ao pressionar Shift+Tab no primeiro,
 * vai para o último. Não faz nada fora da tecla Tab.
 */
export function aplicarFocusTrap(container, event) {
  if (event.key !== 'Tab' || !container) return;
  const focaveis = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  if (focaveis.length === 0) return;
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (event.shiftKey && document.activeElement === primeiro) {
    event.preventDefault();
    ultimo.focus();
  } else if (!event.shiftKey && document.activeElement === ultimo) {
    event.preventDefault();
    primeiro.focus();
  }
}
