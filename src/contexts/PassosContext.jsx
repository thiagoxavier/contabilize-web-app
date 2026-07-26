/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { passosApi } from '../utils/passosApi';

const PassosContext = createContext(null);

export function PassosProvider({ children }) {
  const [passos, setPassos] = useState({}); // { [etapaId]: Passo[] }
  const [mensagens, setMensagens] = useState({}); // { [passoId]: Mensagem[] }
  const [loading, setLoading] = useState(false);

  // --- Ações de Passos ---

  const carregarPassos = useCallback(async (etapaId) => {
    setLoading(true);
    try {
      const data = await passosApi.listarPorEtapa(etapaId);
      setPassos((prev) => ({
        ...prev,
        [etapaId]: data,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarPassoUnico = useCallback(async (passoId, etapaId) => {
    const data = await passosApi.obterPasso(passoId);
    setPassos((prev) => {
      const currentList = prev[etapaId] || [];
      const index = currentList.findIndex((p) => p.id === passoId);
      let newList;
      if (index > -1) {
        newList = [...currentList];
        newList[index] = data;
      } else {
        newList = [...currentList, data];
      }
      return {
        ...prev,
        [etapaId]: newList,
      };
    });
    return data;
  }, []);

  const criarPasso = useCallback(async (etapaId, { titulo, descricao, responsavelId }) => {
    setLoading(true);
    try {
      const data = await passosApi.criarPasso({ etapaId, titulo, descricao, responsavelId });
      setPassos((prev) => ({
        ...prev,
        [etapaId]: [...(prev[etapaId] || []), data],
      }));
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarPasso = useCallback(async (passoId, etapaId, { titulo, descricao, status, responsavelId }) => {
    setLoading(true);
    try {
      const data = await passosApi.atualizarPasso(passoId, { titulo, descricao, status, responsavelId });
      setPassos((prev) => {
        const currentList = prev[etapaId] || [];
        const newList = currentList.map((p) => (p.id === passoId ? data : p));
        return {
          ...prev,
          [etapaId]: newList,
        };
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletarPasso = useCallback(async (passoId, etapaId) => {
    setLoading(true);
    try {
      await passosApi.deletarPasso(passoId);
      setPassos((prev) => {
        const currentList = prev[etapaId] || [];
        const newList = currentList.filter((p) => p.id !== passoId);
        return {
          ...prev,
          [etapaId]: newList,
        };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const reordenarPassos = useCallback(async (etapaId, passosOrdenadosIds) => {
    setLoading(true);
    try {
      await passosApi.reordenarPassos(etapaId, { passosOrdenados: passosOrdenadosIds });
      setPassos((prev) => {
        const currentList = prev[etapaId] || [];
        // Reordenar localmente com base na lista de IDs enviada
        const idMap = new Map(passosOrdenadosIds.map((id, index) => [id, index]));
        const newList = [...currentList].sort((a, b) => {
          const indexA = idMap.has(a.id) ? idMap.get(a.id) : 999999;
          const indexB = idMap.has(b.id) ? idMap.get(b.id) : 999999;
          return indexA - indexB;
        });
        return {
          ...prev,
          [etapaId]: newList,
        };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Ações de Mensagens ---

  const carregarMensagens = useCallback(async (passoId) => {
    setLoading(true);
    try {
      const data = await passosApi.listarMensagens(passoId);
      setMensagens((prev) => ({
        ...prev,
        [passoId]: data,
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const criarMensagem = useCallback(async (passoId, texto) => {
    setLoading(true);
    try {
      const data = await passosApi.criarMensagem({ passoId, texto });
      setMensagens((prev) => ({
        ...prev,
        [passoId]: [...(prev[passoId] || []), data],
      }));
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarMensagem = useCallback(async (mensagemId, passoId, texto) => {
    setLoading(true);
    try {
      const data = await passosApi.atualizarMensagem(mensagemId, { texto });
      setMensagens((prev) => {
        const currentList = prev[passoId] || [];
        const newList = currentList.map((m) => (m.id === mensagemId ? data : m));
        return {
          ...prev,
          [passoId]: newList,
        };
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletarMensagem = useCallback(async (mensagemId, passoId) => {
    setLoading(true);
    try {
      await passosApi.deletarMensagem(mensagemId);
      setMensagens((prev) => {
        const currentList = prev[passoId] || [];
        // Soft-delete no frontend: marcar como deletada ou remover dependendo da regra
        // Como o backend retorna NoContent, a atualização de estado local pode marcar
        // estaDeletada = true ou simplesmente remover do estado local.
        // Vamos marcar como estaDeletada = true para manter coerência com o comportamento do chat de exibir "deletada".
        const newList = currentList.map((m) =>
          m.id === mensagemId ? { ...m, estaDeletada: true } : m
        );
        return {
          ...prev,
          [passoId]: newList,
        };
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PassosContext.Provider
      value={{
        passos,
        mensagens,
        loading,
        carregarPassos,
        carregarPassoUnico,
        criarPasso,
        atualizarPasso,
        deletarPasso,
        reordenarPassos,
        carregarMensagens,
        criarMensagem,
        atualizarMensagem,
        deletarMensagem,
      }}
    >
      {children}
    </PassosContext.Provider>
  );
}

export function usePassos() {
  const context = useContext(PassosContext);
  if (!context) {
    throw new Error('usePassos deve ser usado dentro de um PassosProvider');
  }
  return context;
}
