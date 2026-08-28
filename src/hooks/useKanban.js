import { useState, useEffect, useCallback } from 'react';
import { kanbanService } from '../services/kanbanService';

/** Carrega colunas e cards de um plano. `cards` é um mapa colunaId -> Card[]. */
export function useKanban(planoId) {
  const [colunas, setColunas] = useState([]);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (!planoId) return;
    setLoading(true);
    setErro(null);
    try {
      const cols = await kanbanService.listarColunas(planoId);
      const listas = await Promise.all(cols.map((c) => kanbanService.listarCards(c.id)));
      setColunas(cols);
      setCards(Object.fromEntries(cols.map((c, i) => [c.id, listas[i]])));
    } catch (err) {
      setErro(err.message || 'Erro ao carregar o quadro.');
    } finally {
      setLoading(false);
    }
  }, [planoId]);

  useEffect(() => {
    // Mesmo padrão já aceito em App.jsx: carga inicial dispara loading síncrono.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recarregar();
  }, [recarregar]);

  return { colunas, setColunas, cards, setCards, loading, erro, recarregar };
}
