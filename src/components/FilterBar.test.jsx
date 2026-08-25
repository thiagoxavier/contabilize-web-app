import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from './FilterBar';
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

const PASSOS = [
  { id: 'passo-1', etapaId: 'etapa-1', titulo: 'A', tags: ['urgente', 'fiscal'] },
  { id: 'passo-2', etapaId: 'etapa-1', titulo: 'B', tags: ['fiscal'] },
  { id: 'passo-3', etapaId: 'etapa-2', titulo: 'C', tags: [] },
];

const USUARIOS = [
  { id: 'user-1', nome: 'Ana Corretora' },
  { id: 'user-2', nome: 'Bruno Gerente' },
];

function contextoPadrao(overrides = {}) {
  return {
    passos: PASSOS,
    filtros: { busca: '', etapaId: null, tag: '', responsavelId: null },
    aplicarFiltros: vi.fn().mockResolvedValue([]),
    limparFiltros: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('FilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuariosApi.listarUsuarios.mockResolvedValue(USUARIOS);
  });

  it('lista as tags únicas (ordenadas) derivadas dos passos carregados', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<FilterBar />);

    const select = screen.getByLabelText('Tag');
    const opcoes = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(opcoes).toEqual(['Todas as tags', 'fiscal', 'urgente']);
  });

  it('carrega os responsáveis via usuariosApi e lista no seletor', async () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<FilterBar />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Ana Corretora' })).toBeInTheDocument();
    });
    expect(usuariosApi.listarUsuarios).toHaveBeenCalled();
  });

  it('busca por texto é debounced antes de chamar aplicarFiltros', async () => {
    const aplicarFiltros = vi.fn().mockResolvedValue([]);
    useKanban.mockReturnValue(contextoPadrao({ aplicarFiltros }));
    render(<FilterBar />);

    fireEvent.change(screen.getByLabelText('Buscar por título ou descrição'), { target: { value: 'contrato' } });

    expect(aplicarFiltros).not.toHaveBeenCalled();
    await waitFor(() => expect(aplicarFiltros).toHaveBeenCalledWith({ busca: 'contrato' }), { timeout: 1000 });
  });

  it('seleciona uma tag e chama aplicarFiltros com o valor escolhido', async () => {
    const aplicarFiltros = vi.fn().mockResolvedValue([]);
    useKanban.mockReturnValue(contextoPadrao({ aplicarFiltros }));
    render(<FilterBar />);

    await userEvent.selectOptions(screen.getByLabelText('Tag'), 'fiscal');
    expect(aplicarFiltros).toHaveBeenCalledWith({ tag: 'fiscal' });
  });

  it('seleciona um responsável e chama aplicarFiltros com o id escolhido', async () => {
    const aplicarFiltros = vi.fn().mockResolvedValue([]);
    useKanban.mockReturnValue(contextoPadrao({ aplicarFiltros }));
    render(<FilterBar />);

    await waitFor(() => screen.getByRole('option', { name: 'Bruno Gerente' }));
    await userEvent.selectOptions(screen.getByLabelText('Responsável'), 'user-2');
    expect(aplicarFiltros).toHaveBeenCalledWith({ responsavelId: 'user-2' });
  });

  it('botão "Limpar filtros" começa desabilitado quando não há filtro ativo', () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<FilterBar />);

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeDisabled();
  });

  it('botão "Limpar filtros" habilita quando há um filtro de tag/responsável ativo', () => {
    useKanban.mockReturnValue(contextoPadrao({ filtros: { busca: '', etapaId: null, tag: 'fiscal', responsavelId: null } }));
    render(<FilterBar />);

    expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeEnabled();
  });

  it('anuncia a contagem de passos encontrados em uma região role="status" aria-live="polite"', () => {
    useKanban.mockReturnValue(contextoPadrao());
    render(<FilterBar />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('3 passos encontrados.');
  });

  it('atualiza a contagem anunciada quando a lista de passos filtrados muda', () => {
    useKanban.mockReturnValue(contextoPadrao({ passos: [PASSOS[0]] }));
    render(<FilterBar />);

    expect(screen.getByRole('status')).toHaveTextContent('1 passo encontrado.');
  });

  it('"Limpar filtros" chama limparFiltros do contexto e esvazia o campo de busca', async () => {
    const limparFiltros = vi.fn().mockResolvedValue([]);
    useKanban.mockReturnValue(contextoPadrao({
      filtros: { busca: 'contrato', etapaId: null, tag: '', responsavelId: null },
      limparFiltros,
    }));
    render(<FilterBar />);

    const input = screen.getByLabelText('Buscar por título ou descrição');
    fireEvent.change(input, { target: { value: 'contrato' } });

    await userEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

    expect(limparFiltros).toHaveBeenCalled();
    expect(input).toHaveValue('');
  });
});
