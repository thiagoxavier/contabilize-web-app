import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanProvider, useKanban } from './KanbanContext';
import { empresasApi } from '../utils/empresasApi';

vi.mock('../utils/empresasApi', () => ({
  empresasApi: {
    listarEtapas: vi.fn(),
    criarEtapa: vi.fn(),
    atualizarEtapa: vi.fn(),
    deletarEtapa: vi.fn(),
  },
}));

vi.mock('../utils/passosApi', () => ({
  passosApi: {
    listarPorPipeline: vi.fn(),
    criarPasso: vi.fn(),
    atualizarPasso: vi.fn(),
    deletarPasso: vi.fn(),
    moverPasso: vi.fn(),
  },
}));

function Consumidor() {
  const { etapas, erro, loading, fetchEtapas } = useKanban();
  return (
    <div>
      <button onClick={() => fetchEtapas().catch(() => {})}>carregar</button>
      {loading && <span>carregando</span>}
      {erro && <span role="alert">{erro}</span>}
      <ul>
        {etapas.map((e) => (
          <li key={e.id}>{e.label}</li>
        ))}
      </ul>
    </div>
  );
}

describe('KanbanContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega etapas do pipeline via fetchEtapas e chama o endpoint real', async () => {
    empresasApi.listarEtapas.mockResolvedValue([
      { id: 'e1', empresaId: 'empresa-1', label: 'A fazer', status: 0, ordem: 0 },
    ]);

    render(
      <KanbanProvider pipelineId="empresa-1">
        <Consumidor />
      </KanbanProvider>
    );

    await userEvent.click(screen.getByText('carregar'));

    expect(await screen.findByText('A fazer')).toBeInTheDocument();
    expect(empresasApi.listarEtapas).toHaveBeenCalledWith('empresa-1');
  });

  it('expõe o erro de negócio retornado pela API em vez de travar silenciosamente', async () => {
    empresasApi.listarEtapas.mockRejectedValue(new Error('Empresa não encontrada.'));

    render(
      <KanbanProvider pipelineId="empresa-1">
        <Consumidor />
      </KanbanProvider>
    );

    await userEvent.click(screen.getByText('carregar'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Empresa não encontrada.');
  });

  it('lança erro ao usar useKanban fora de um KanbanProvider', () => {
    function ForaDoProvider() {
      useKanban();
      return null;
    }
    expect(() => render(<ForaDoProvider />)).toThrow(
      'useKanban deve ser usado dentro de um KanbanProvider'
    );
  });
});
