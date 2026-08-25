import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassoModal } from './PassoModal';
import { useKanban } from '../contexts/KanbanContext';
import { usuariosApi } from '../utils/usuariosApi';

vi.mock('../contexts/KanbanContext', () => ({
  useKanban: vi.fn(),
}));

vi.mock('../utils/usuariosApi', () => ({
  usuariosApi: {
    listarUsuarios: vi.fn(),
  },
}));

const PASSO = {
  id: 'passo-1',
  etapaId: 'etapa-1',
  titulo: 'Enviar contrato',
  descricao: 'Aguardando assinatura do cliente',
  tags: ['urgente'],
  responsavelId: 'user-1',
};

const USUARIOS = [
  { id: 'user-1', nome: 'Ana Corretora' },
  { id: 'user-2', nome: 'Bruno Gerente' },
];

function contextoPadrao(overrides = {}) {
  return {
    editarPasso: vi.fn().mockResolvedValue({ ...PASSO }),
    deletarPasso: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('PassoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuariosApi.listarUsuarios.mockResolvedValue(USUARIOS);
  });

  it('não renderiza nada quando passo é null', () => {
    useKanban.mockReturnValue(contextoPadrao());
    const { container } = render(<PassoModal passo={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('preenche o formulário com os dados do passo e a lista de responsáveis', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<PassoModal passo={PASSO} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Título')).toHaveValue('Enviar contrato');
    expect(screen.getByLabelText('Descrição')).toHaveValue('Aguardando assinatura do cliente');
    expect(screen.getByText('urgente')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Corretora' })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Responsável')).toHaveValue('user-1');
  });

  it('rejeita título vazio e não chama editarPasso', async () => {
    const editarPasso = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ editarPasso }));
    render(<PassoModal passo={PASSO} onClose={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Título é obrigatório.');
    expect(editarPasso).not.toHaveBeenCalled();
  });

  it('salva as alterações e fecha o modal com toast de sucesso', async () => {
    const editarPasso = vi.fn().mockResolvedValue({ ...PASSO, titulo: 'Enviar contrato revisado' });
    const onClose = vi.fn();
    const onToast = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ editarPasso }));
    render(<PassoModal passo={PASSO} onClose={onClose} onToast={onToast} />);

    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.type(screen.getByLabelText('Título'), 'Enviar contrato revisado');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(editarPasso).toHaveBeenCalledWith('passo-1', {
      titulo: 'Enviar contrato revisado',
      descricao: 'Aguardando assinatura do cliente',
      responsavelId: 'user-1',
      tags: ['urgente'],
    }));
    expect(onToast).toHaveBeenCalledWith('Passo atualizado com sucesso.');
    expect(onClose).toHaveBeenCalled();
  });

  it('mostra toast de erro e mantém o modal aberto quando editarPasso falha', async () => {
    const editarPasso = vi.fn().mockRejectedValue(new Error('Não foi possível salvar o passo.'));
    const onClose = vi.fn();
    const onToast = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ editarPasso }));
    render(<PassoModal passo={PASSO} onClose={onClose} onToast={onToast} />);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('Não foi possível salvar o passo.'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('adiciona uma tag ao pressionar Enter e permite removê-la', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<PassoModal passo={PASSO} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Tags'), 'fiscal{Enter}');
    expect(screen.getByText('fiscal')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remover tag urgente' }));
    expect(screen.queryByText('urgente')).not.toBeInTheDocument();
  });

  it('pede confirmação antes de deletar e só chama deletarPasso após confirmar', async () => {
    const deletarPasso = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const onToast = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ deletarPasso }));
    render(<PassoModal passo={PASSO} onClose={onClose} onToast={onToast} />);

    await userEvent.click(screen.getByRole('button', { name: 'Deletar' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(deletarPasso).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => expect(deletarPasso).toHaveBeenCalledWith('passo-1'));
    expect(onToast).toHaveBeenCalledWith('Passo excluído com sucesso.');
    expect(onClose).toHaveBeenCalled();
  });

  it('fecha o modal ao pressionar Esc', async () => {
    const onClose = vi.fn();
    useKanban.mockReturnValue(contextoPadrao());
    render(<PassoModal passo={PASSO} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('confirmação de exclusão: tem aria-modal="true" e move o foco para o primeiro botão ao abrir', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<PassoModal passo={PASSO} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Deletar' }));

    const caixa = screen.getByRole('alertdialog');
    expect(caixa).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Confirmar exclusão' })).toHaveFocus();
  });

  it('confirmação de exclusão: Esc fecha só a confirmação, não o modal inteiro', async () => {
    const onClose = vi.fn();
    const deletarPasso = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ deletarPasso }));
    render(<PassoModal passo={PASSO} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Deletar' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(deletarPasso).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Título')).toBeInTheDocument(); // modal principal ainda aberto
    expect(screen.getByRole('button', { name: 'Deletar' })).toHaveFocus();
  });

  it('devolve o foco ao elemento que abriu o modal ao cancelar', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    function Wrapper() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>Abrir</button>
          {aberto && <PassoModal passo={PASSO} onClose={() => setAberto(false)} />}
        </div>
      );
    }
    render(<Wrapper />);

    const botaoAbrir = screen.getByRole('button', { name: 'Abrir' });
    botaoAbrir.focus();
    await userEvent.click(botaoAbrir);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar', exact: true }));

    await waitFor(() => expect(botaoAbrir).toHaveFocus());
  });

  it('devolve o foco ao elemento que abriu o modal ao fechar pelo X', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    function Wrapper() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>Abrir</button>
          {aberto && <PassoModal passo={PASSO} onClose={() => setAberto(false)} />}
        </div>
      );
    }
    render(<Wrapper />);

    const botaoAbrir = screen.getByRole('button', { name: 'Abrir' });
    botaoAbrir.focus();
    await userEvent.click(botaoAbrir);

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    await waitFor(() => expect(botaoAbrir).toHaveFocus());
  });

  it('devolve o foco ao elemento que abriu o modal ao pressionar Esc', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    function Wrapper() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>Abrir</button>
          {aberto && <PassoModal passo={PASSO} onClose={() => setAberto(false)} />}
        </div>
      );
    }
    render(<Wrapper />);

    const botaoAbrir = screen.getByRole('button', { name: 'Abrir' });
    botaoAbrir.focus();
    await userEvent.click(botaoAbrir);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(botaoAbrir).toHaveFocus());
  });

  it('devolve o foco ao elemento que abriu o modal após salvar com sucesso', async () => {
    const editarPasso = vi.fn().mockResolvedValue({ ...PASSO });
    useKanban.mockReturnValue(contextoPadrao({ editarPasso }));
    function Wrapper() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>Abrir</button>
          {aberto && <PassoModal passo={PASSO} onClose={() => setAberto(false)} />}
        </div>
      );
    }
    render(<Wrapper />);

    const botaoAbrir = screen.getByRole('button', { name: 'Abrir' });
    botaoAbrir.focus();
    await userEvent.click(botaoAbrir);

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(botaoAbrir).toHaveFocus());
  });

  it('devolve o foco ao elemento que abriu o modal após excluir com sucesso (opener estático, sem desmontar)', async () => {
    const deletarPasso = vi.fn().mockResolvedValue(undefined);
    useKanban.mockReturnValue(contextoPadrao({ deletarPasso }));
    function Wrapper() {
      const [aberto, setAberto] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setAberto(true)}>Abrir</button>
          {aberto && <PassoModal passo={PASSO} onClose={() => setAberto(false)} />}
        </div>
      );
    }
    render(<Wrapper />);

    const botaoAbrir = screen.getByRole('button', { name: 'Abrir' });
    botaoAbrir.focus();
    await userEvent.click(botaoAbrir);

    await userEvent.click(screen.getByRole('button', { name: 'Deletar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => expect(botaoAbrir).toHaveFocus());
  });

  it('ao excluir um passo dentro de uma lista real, cujo botão "opener" desmonta no mesmo commit, foca um destino estável em vez do <body>', async () => {
    // Cenário real (diferente do teste anterior, que usa um botão estático
    // que nunca desmonta): o "opener" é o botão do próprio passo dentro de
    // uma lista — exatamente como o <PassoCard/> dentro do <KanbanBoard/>.
    // Ao excluir, `onDeletado` remove esse passo da lista (desmontando seu
    // botão) no mesmo commit em que o modal fecha.
    const deletarPasso = vi.fn().mockResolvedValue(undefined);
    useKanban.mockReturnValue(contextoPadrao({ deletarPasso }));

    function BoardWrapper() {
      const [passosAbertos, setPassosAbertos] = useState([
        { ...PASSO, id: 'passo-1', titulo: 'Passo 1' },
        { ...PASSO, id: 'passo-2', titulo: 'Passo 2' },
      ]);
      const [passoSelecionado, setPassoSelecionado] = useState(null);

      return (
        <div>
          {/* Simula o wrapper estável do KanbanBoard (ver utils/a11yFocus.js) */}
          <div data-kb-focus-anchor tabIndex={-1} aria-label="Board Kanban">Board</div>
          <ul>
            {passosAbertos.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => setPassoSelecionado(p)}>{p.titulo}</button>
              </li>
            ))}
          </ul>
          {passoSelecionado && (
            <PassoModal
              passo={passoSelecionado}
              onClose={() => setPassoSelecionado(null)}
              onDeletado={(id) => {
                // Mesmo commit: remove o passo da lista (desmonta seu botão)
                // e fecha o modal.
                setPassosAbertos((prev) => prev.filter((p) => p.id !== id));
                setPassoSelecionado(null);
              }}
            />
          )}
        </div>
      );
    }

    render(<BoardWrapper />);

    const botaoPasso1 = screen.getByRole('button', { name: 'Passo 1' });
    await userEvent.click(botaoPasso1);

    await userEvent.click(screen.getByRole('button', { name: 'Deletar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => expect(deletarPasso).toHaveBeenCalledWith('passo-1'));
    // Confirma que este é de fato o cenário real: o botão "opener" foi
    // desmontado (não é mais o mesmo elemento estático de antes).
    expect(screen.queryByRole('button', { name: 'Passo 1' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Board Kanban')).toHaveFocus());
  });
});
