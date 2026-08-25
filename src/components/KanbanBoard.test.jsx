import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanBoard } from './KanbanBoard';
import { useKanban } from '../contexts/KanbanContext';

vi.mock('../contexts/KanbanContext', () => ({
  useKanban: vi.fn(),
}));

const ETAPAS = [
  { id: 'etapa-1', label: 'A fazer', ordem: 0 },
  { id: 'etapa-2', label: 'Em andamento', ordem: 1 },
];

const PASSOS = [
  { id: 'passo-1', etapaId: 'etapa-1', titulo: 'Primeiro passo', ordemExibicao: 0, tags: [] },
  { id: 'passo-2', etapaId: 'etapa-2', titulo: 'Segundo passo', ordemExibicao: 0, tags: [] },
];

function contextoPadrao(overrides = {}) {
  return {
    pipelineId: 'empresa-1',
    etapas: ETAPAS,
    passos: PASSOS,
    filtros: {},
    loading: false,
    erro: null,
    fetchEtapas: vi.fn(),
    fetchPassos: vi.fn(),
    criarEtapa: vi.fn().mockResolvedValue({}),
    editarEtapa: vi.fn().mockResolvedValue({}),
    deletarEtapa: vi.fn().mockResolvedValue({}),
    criarPasso: vi.fn().mockResolvedValue({}),
    editarPasso: vi.fn().mockResolvedValue({}),
    deletarPasso: vi.fn().mockResolvedValue({}),
    moverPasso: vi.fn().mockResolvedValue({}),
    aplicarFiltros: vi.fn(),
    limparFiltros: vi.fn(),
    ...overrides,
  };
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza uma coluna por etapa, cada uma com seus passos', () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<KanbanBoard />);

    expect(screen.getByRole('region', { name: 'Etapa A fazer' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Etapa Em andamento' })).toBeInTheDocument();
    expect(screen.getByText('Primeiro passo')).toBeInTheDocument();
    expect(screen.getByText('Segundo passo')).toBeInTheDocument();
  });

  it('mostra esqueleto de carregamento quando loading=true e ainda não há etapas', () => {
    useKanban.mockReturnValue(contextoPadrao({ etapas: [], passos: [], loading: true }));
    render(<KanbanBoard />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('anuncia o carregamento inicial a leitores de tela com um texto equivalente ao esqueleto visual', () => {
    useKanban.mockReturnValue(contextoPadrao({ etapas: [], passos: [], loading: true }));
    render(<KanbanBoard />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando passos...');
  });

  it('exibe o erro do contexto em um banner com role="alert" e permite fechá-lo', async () => {
    useKanban.mockReturnValue(contextoPadrao({ erro: 'Não foi possível mover o passo.' }));
    render(<KanbanBoard />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível mover o passo.');

    await userEvent.click(screen.getByRole('button', { name: 'Fechar mensagem de erro' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('Corretor (podeGerenciarEtapas=false) não vê a coluna de criar nova etapa', () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<KanbanBoard podeGerenciarEtapas={false} />);

    expect(screen.queryByRole('button', { name: 'Nova etapa' })).not.toBeInTheDocument();
  });

  it('Gerente/Admin (podeGerenciarEtapas=true) cria uma nova etapa pela coluna dedicada', async () => {
    const criarEtapa = vi.fn().mockResolvedValue({});
    useKanban.mockReturnValue(contextoPadrao({ criarEtapa }));
    render(<KanbanBoard podeGerenciarEtapas />);

    await userEvent.click(screen.getByRole('button', { name: 'Nova etapa' }));
    await userEvent.type(screen.getByLabelText('Nome da nova etapa'), 'Concluído');
    await userEvent.click(screen.getByRole('button', { name: 'Criar' }));

    expect(criarEtapa).toHaveBeenCalledWith('Concluído');
  });

  it('move um passo para outra etapa via o seletor acessível do card (mesmo caminho usado pelo drag-and-drop)', async () => {
    const moverPasso = vi.fn().mockResolvedValue({});
    useKanban.mockReturnValue(contextoPadrao({ moverPasso }));
    render(<KanbanBoard />);

    const select = screen.getByRole('combobox', { name: /mover passo "Primeiro passo"/i });
    await userEvent.selectOptions(select, 'etapa-2');

    expect(moverPasso).toHaveBeenCalledWith('passo-1', 'etapa-2');
  });

  it('não chama moverPasso quando o destino é a própria etapa atual do passo', async () => {
    const moverPasso = vi.fn();
    useKanban.mockReturnValue(contextoPadrao({ moverPasso }));
    render(<KanbanBoard />);

    // "Primeiro passo" está em etapa-1; suas opções de destino não incluem etapa-1.
    const select = screen.getByRole('combobox', { name: /mover passo "Primeiro passo"/i });
    const opcoes = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(opcoes).not.toContain('etapa-1');
  });
});
