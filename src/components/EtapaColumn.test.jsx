import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EtapaColumn } from './EtapaColumn';

const ETAPA = { id: 'etapa-1', label: 'A fazer', ordem: 0 };

const PASSOS = [
  { id: 'passo-1', etapaId: 'etapa-1', titulo: 'Primeiro passo', tags: [] },
  { id: 'passo-2', etapaId: 'etapa-1', titulo: 'Segundo passo', tags: [] },
];

describe('EtapaColumn', () => {
  it('renderiza o nome da etapa, a contagem e os cards de passo', () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} />);

    expect(screen.getByRole('region', { name: 'Etapa A fazer' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Primeiro passo')).toBeInTheDocument();
    expect(screen.getByText('Segundo passo')).toBeInTheDocument();
  });

  it('mostra dica de coluna vazia quando não há passos', () => {
    render(<EtapaColumn etapa={ETAPA} passos={[]} />);
    expect(screen.getByText(/Nenhum passo nesta etapa/)).toBeInTheDocument();
  });

  it('coluna vazia: a dica "Nenhum passo..." é um role="listitem" dentro do role="list" (sem violar ARIA)', () => {
    render(<EtapaColumn etapa={ETAPA} passos={[]} />);

    const lista = screen.getByRole('list', { name: /passos da etapa/i });
    const filhosDiretos = Array.from(lista.children);

    expect(filhosDiretos.length).toBeGreaterThan(0);
    filhosDiretos.forEach((filho) => {
      expect(filho).toHaveAttribute('role', 'listitem');
    });
    expect(screen.getByText(/Nenhum passo nesta etapa/)).toHaveAttribute('role', 'listitem');
  });

  it('Corretor (podeGerenciarEtapas=false) não vê o menu de renomear/excluir a etapa', () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas={false} />);
    expect(screen.queryByRole('button', { name: /mais ações da etapa/i })).not.toBeInTheDocument();
  });

  it('Gerente/Admin (podeGerenciarEtapas=true) pode renomear a etapa', async () => {
    const onEditarEtapa = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas onEditarEtapa={onEditarEtapa} />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /renomear/i }));

    const input = screen.getByLabelText('Novo nome da etapa');
    await userEvent.clear(input);
    await userEvent.type(input, 'Em andamento');
    await userEvent.click(screen.getByRole('button', { name: /salvar nome da etapa/i }));

    expect(onEditarEtapa).toHaveBeenCalledWith('etapa-1', 'Em andamento');
  });

  it('rejeita nome vazio ao renomear a etapa (obrigatório)', async () => {
    const onEditarEtapa = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas onEditarEtapa={onEditarEtapa} />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /renomear/i }));
    await userEvent.clear(screen.getByLabelText('Novo nome da etapa'));
    await userEvent.click(screen.getByRole('button', { name: /salvar nome da etapa/i }));

    expect(screen.getByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(onEditarEtapa).not.toHaveBeenCalled();
  });

  it('pede confirmação antes de excluir a etapa e só chama onDeletarEtapa após confirmar', async () => {
    const onDeletarEtapa = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas onDeletarEtapa={onDeletarEtapa} />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /excluir/i }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(onDeletarEtapa).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onDeletarEtapa).toHaveBeenCalledWith('etapa-1');
  });

  it('exclusão bem-sucedida: a coluna é desmontada e o foco vai para um destino ESTÁVEL fora dela, não para o <body>', async () => {
    // Simula o <KanbanBoard/> real: quando a exclusão resolve com sucesso, a
    // etapa some da lista e a coluna desmonta por completo — este componente
    // não sobrevive para devolver o foco a si mesmo (diferente do
    // cancelamento, que refoca o próprio botão "Mais ações" da coluna).
    function BoardWrapper() {
      const [etapaExiste, setEtapaExiste] = useState(true);
      return (
        <div>
          <div data-kb-focus-anchor tabIndex={-1} aria-label="Board Kanban">Board</div>
          {etapaExiste && (
            <EtapaColumn
              etapa={ETAPA}
              passos={PASSOS}
              podeGerenciarEtapas
              onDeletarEtapa={() => Promise.resolve().then(() => setEtapaExiste(false))}
            />
          )}
        </div>
      );
    }

    render(<BoardWrapper />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /excluir/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(screen.queryByRole('region', { name: 'Etapa A fazer' })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText('Board Kanban')).toHaveFocus());
  });

  it('cria um novo passo pelo formulário inline com validação de nome obrigatório', async () => {
    const onCriarPasso = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={[]} onCriarPasso={onCriarPasso} />);

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    expect(screen.getByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(onCriarPasso).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/título do novo passo/i), 'Novo passo');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onCriarPasso).toHaveBeenCalledWith('etapa-1', 'Novo passo');
  });

  it('menu "Mais ações": tem aria-haspopup="menu" e move o foco para o primeiro item ao abrir', async () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />);

    const trigger = screen.getByRole('button', { name: /mais ações da etapa/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await userEvent.click(trigger);

    const itens = screen.getAllByRole('menuitem');
    expect(itens[0]).toHaveFocus();
  });

  it('menu "Mais ações": ArrowDown/ArrowUp/Home/End navegam entre os itens', async () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    const itens = screen.getAllByRole('menuitem');
    expect(itens[0]).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(itens[1]).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(itens[0]).toHaveFocus(); // wrap para o início

    await userEvent.keyboard('{ArrowUp}');
    expect(itens[1]).toHaveFocus(); // wrap para o fim

    await userEvent.keyboard('{Home}');
    expect(itens[0]).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(itens[itens.length - 1]).toHaveFocus();
  });

  it('menu "Mais ações": Escape fecha o menu e devolve o foco ao botão disparador', async () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />);

    const trigger = screen.getByRole('button', { name: /mais ações da etapa/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('menu "Mais ações": fecha ao clicar fora dele', async () => {
    render(
      <div>
        <button type="button">Fora</button>
        <EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fora' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('confirmação de exclusão da etapa: tem aria-modal="true" e move o foco para o primeiro botão ao abrir', async () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /excluir/i }));

    const caixa = screen.getByRole('alertdialog');
    expect(caixa).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveFocus();
  });

  it('confirmação de exclusão da etapa: Tab/Shift+Tab ficam contidos nos botões do diálogo (focus trap real)', async () => {
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas />);

    await userEvent.click(screen.getByRole('button', { name: /mais ações da etapa/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /excluir/i }));

    const excluirBtn = screen.getByRole('button', { name: 'Excluir' });
    const cancelarBtn = screen.getByRole('button', { name: 'Cancelar' });
    expect(excluirBtn).toHaveFocus();

    // Shift+Tab no primeiro elemento (Excluir) vai para o último (Cancelar),
    // em vez de escapar para outros controles da coluna.
    await userEvent.tab({ shift: true });
    expect(cancelarBtn).toHaveFocus();

    // Tab no último elemento (Cancelar) volta para o primeiro (Excluir).
    await userEvent.tab();
    expect(excluirBtn).toHaveFocus();
  });

  it('confirmação de exclusão da etapa: Esc fecha só a confirmação e devolve o foco ao botão "Mais ações"', async () => {
    const onDeletarEtapa = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} podeGerenciarEtapas onDeletarEtapa={onDeletarEtapa} />);

    const trigger = screen.getByRole('button', { name: /mais ações da etapa/i });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('menuitem', { name: /excluir/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onDeletarEtapa).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('destaca a coluna ao arrastar um card sobre ela e chama onMoverPasso ao soltar', () => {
    const onMoverPasso = vi.fn();
    render(<EtapaColumn etapa={ETAPA} passos={PASSOS} onMoverPasso={onMoverPasso} />);

    const coluna = screen.getByRole('region', { name: 'Etapa A fazer' });
    const dataTransfer = { getData: vi.fn(() => 'passo-9'), setData: vi.fn(), dropEffect: '' };

    fireEvent.dragOver(coluna, { dataTransfer });
    expect(coluna.className).toContain('kb-column-drag-over');

    fireEvent.drop(coluna, { dataTransfer });

    expect(onMoverPasso).toHaveBeenCalledWith('passo-9', 'etapa-1');
  });
});
