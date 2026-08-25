import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassoCard } from './PassoCard';

const PASSO = {
  id: 'passo-1',
  etapaId: 'etapa-1',
  titulo: 'Enviar documentação',
  descricao: 'Coletar contrato social e enviar para análise.',
  tags: ['urgente', 'documentos'],
  responsavelId: 'user-1',
  mensagens: [{ id: 'm1' }, { id: 'm2' }],
};

const ETAPAS_PARA_MOVER = [
  { id: 'etapa-2', label: 'Em análise' },
  { id: 'etapa-3', label: 'Concluído' },
];

describe('PassoCard', () => {
  it('renderiza título, descrição, tags e badges de responsável/mensagens', () => {
    render(<PassoCard passo={PASSO} etapasDisponiveis={ETAPAS_PARA_MOVER} />);

    expect(screen.getByText('Enviar documentação')).toBeInTheDocument();
    expect(screen.getByText('Coletar contrato social e enviar para análise.')).toBeInTheDocument();
    expect(screen.getByText('urgente')).toBeInTheDocument();
    expect(screen.getByText('documentos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // contagem de mensagens
  });

  it('chama onClick ao ativar o título do card', async () => {
    const onClick = vi.fn();
    render(<PassoCard passo={PASSO} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Enviar documentação' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('chama onMover com o id da etapa escolhida no select "Mover para" (alternativa por teclado)', async () => {
    const onMover = vi.fn();
    render(<PassoCard passo={PASSO} etapasDisponiveis={ETAPAS_PARA_MOVER} onMover={onMover} />);

    const select = screen.getByRole('combobox', { name: /mover passo "Enviar documentação" para outra etapa/i });
    await userEvent.selectOptions(select, 'etapa-3');

    expect(onMover).toHaveBeenCalledWith('etapa-3');
  });

  it('desabilita título e select e mostra spinner quando isMoving=true', () => {
    render(<PassoCard passo={PASSO} etapasDisponiveis={ETAPAS_PARA_MOVER} isMoving />);

    expect(screen.getByRole('button', { name: 'Enviar documentação' })).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Movendo passo...' })).toBeInTheDocument();
    expect(screen.getByTestId('passo-card')).toHaveAttribute('draggable', 'false');
  });

  it('desabilita os controles quando disabled=true (ação em andamento em outro card)', () => {
    render(<PassoCard passo={PASSO} disabled />);

    expect(screen.getByRole('button', { name: 'Enviar documentação' })).toBeDisabled();
  });

  it('expõe role="listitem" na raiz para ser filho válido do role="list" da coluna', () => {
    render(<PassoCard passo={PASSO} />);
    expect(screen.getByTestId('passo-card')).toHaveAttribute('role', 'listitem');
  });

  it('inicia o drag nativo colocando o id do passo no dataTransfer', () => {
    render(<PassoCard passo={PASSO} />);
    const card = screen.getByTestId('passo-card');
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(), effectAllowed: '' };

    fireEvent.dragStart(card, { dataTransfer });

    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'passo-1');
  });
});
