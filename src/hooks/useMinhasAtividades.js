import { useState, useEffect, useCallback } from 'react';
import { kanbanService } from '../services/kanbanService';

/**
 * Cards do Kanban Multi-Planos agregados entre todos os planos ("Minhas Atividades").
 * `assigneeId` vazio deixa o backend filtrar pelo usuário autenticado; um Administrador
 * pode passar o id de outro usuário para ver a agenda dele.
 *
 * Além da lista, carrega (e mantém em cache) as colunas de cada plano presente nos
 * resultados, para alimentar o seletor "mover para" sem precisar abrir o quadro.
 */
export function useMinhasAtividades(habilitado, assigneeId) {
  const [atividades, setAtividades] = useState([]);
  const [colunasPorPlano, setColunasPorPlano] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!habilitado) return;
    setLoading(true);
    setErro(null);
    try {
      const lista = await kanbanService.listarMinhasAtividades(assigneeId || null);
      setAtividades(lista);

      const planoIds = [...new Set(lista.map((a) => a.planoId))];
      const entradas = await Promise.all(
        planoIds.map(async (planoId) => [planoId, await kanbanService.listarColunas(planoId)])
      );
      setColunasPorPlano(Object.fromEntries(entradas));
    } catch (err) {
      setErro(err.message || 'Erro ao carregar atividades.');
    } finally {
      setLoading(false);
    }
  }, [habilitado, assigneeId]);

  useEffect(() => {
    // Mesmo padrão já aceito em usePlanos: carga inicial dispara loading síncrono.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar();
  }, [recarregar]);

  const moverAtividade = useCallback(async (cardId, novaColunaId, novaColunaNome) => {
    await kanbanService.moverCard(cardId, novaColunaId);
    setAtividades((atual) =>
      atual.map((a) => (a.cardId === cardId ? { ...a, colunaId: novaColunaId, colunaNome: novaColunaNome } : a))
    );
  }, []);

  return { atividades, colunasPorPlano, loading, erro, recarregar, moverAtividade };
}
