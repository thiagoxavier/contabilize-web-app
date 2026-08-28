import { useState, useEffect, useCallback } from 'react';
import { kanbanService } from '../services/kanbanService';

/**
 * Lista de planos do Kanban, compartilhada entre a Sidebar (menu) e a página
 * "Gerenciar planos". Só busca quando `habilitado` (usuário Administrador).
 */
export function usePlanos(habilitado) {
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!habilitado) return;
    setLoading(true);
    setErro(null);
    try {
      setPlanos(await kanbanService.listarPlanos());
    } catch (err) {
      setErro(err.message || 'Erro ao carregar planos.');
    } finally {
      setLoading(false);
    }
  }, [habilitado]);

  useEffect(() => {
    // Mesmo padrão já aceito em App.jsx: carga inicial dispara loading síncrono.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar();
  }, [recarregar]);

  const criar = useCallback(async ({ nome, descricao }) => {
    const plano = await kanbanService.criarPlano({ nome, descricao });
    setPlanos((atual) => [plano, ...atual]);
    return plano;
  }, []);

  const atualizar = useCallback(async (planoId, { nome, descricao }) => {
    const plano = await kanbanService.atualizarPlano(planoId, { nome, descricao });
    setPlanos((atual) => atual.map((p) => (p.id === planoId ? plano : p)));
    return plano;
  }, []);

  const deletar = useCallback(async (planoId) => {
    await kanbanService.deletarPlano(planoId);
    setPlanos((atual) => atual.filter((p) => p.id !== planoId));
  }, []);

  return { planos, loading, erro, recarregar, criar, atualizar, deletar };
}
