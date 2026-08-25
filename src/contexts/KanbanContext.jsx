/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { empresasApi } from '../utils/empresasApi';
import { passosApi } from '../utils/passosApi';

const KanbanContext = createContext(null);

const FILTROS_PADRAO = { busca: '', etapaId: null, tag: '', responsavelId: null };

// Estado e ações do board Kanban de uma Empresa (PRD-KANBAN §5.2/§5.3).
// "pipelineId" é o EmpresaId — cada Empresa tem seu próprio board de Etapas/Passos
// (ver nota de desvio do PRD em docs/contexto/CONTRATO-API.md).
export function KanbanProvider({ pipelineId, children }) {
  const [etapas, setEtapas] = useState([]);
  const [passos, setPassos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const fetchEtapas = useCallback(async () => {
    if (!pipelineId) return [];
    setLoading(true);
    setErro(null);
    try {
      const data = await empresasApi.listarEtapas(pipelineId);
      setEtapas(data);
      return data;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const fetchPassos = useCallback(async (filtrosParam) => {
    if (!pipelineId) return [];
    const filtrosAtivos = filtrosParam ?? filtros;
    setLoading(true);
    setErro(null);
    try {
      const data = await passosApi.listarPorPipeline(pipelineId, filtrosAtivos);
      setPassos(data);
      return data;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [pipelineId, filtros]);

  // --- Etapas (read-only para Corretor; CRUD completo para Gerente/Admin) ---

  const criarEtapa = useCallback(async (nome) => {
    setLoading(true);
    setErro(null);
    try {
      const nova = await empresasApi.criarEtapa(pipelineId, { label: nome });
      setEtapas((prev) => [...prev, nova]);
      return nova;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  const editarEtapa = useCallback(async (etapaId, nome, status) => {
    setLoading(true);
    setErro(null);
    try {
      // AtualizarEtapaDto exige Label + Status; preserva o status atual quando
      // o chamador só quer renomear a etapa.
      const atual = etapas.find((e) => e.id === etapaId);
      const statusFinal = status ?? atual?.status ?? 0;
      const atualizada = await empresasApi.atualizarEtapa(etapaId, { label: nome, status: statusFinal });
      setEtapas((prev) => prev.map((e) => (e.id === etapaId ? atualizada : e)));
      return atualizada;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [etapas]);

  const deletarEtapa = useCallback(async (etapaId) => {
    setLoading(true);
    setErro(null);
    try {
      await empresasApi.deletarEtapa(etapaId);
      setEtapas((prev) => prev.filter((e) => e.id !== etapaId));
      // Regra de negócio: o backend move os passos da etapa excluída para a etapa
      // anterior (ou a primeira da empresa). Recarrega os passos para refletir o
      // novo etapaId de cada um — não há como inferir isso localmente.
      await fetchPassos();
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchPassos]);

  // --- Passos (CRUD liberado a qualquer usuário autenticado do tenant hoje;
  // Corretor fica restrito à própria empresa quando essa associação existir) ---

  const criarPasso = useCallback(async (etapaId, titulo, descricao, extras = {}) => {
    setLoading(true);
    setErro(null);
    try {
      const novo = await passosApi.criarPasso({
        etapaId,
        titulo,
        descricao,
        responsavelId: extras.responsavelId ?? null,
        tags: extras.tags ?? null,
      });
      setPassos((prev) => [...prev, novo]);
      return novo;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const editarPasso = useCallback(async (passoId, data = {}) => {
    setLoading(true);
    setErro(null);
    try {
      // AtualizarPassoDto exige todos os campos; preserva os valores atuais do
      // passo para os campos não informados pelo chamador.
      const atual = passos.find((p) => p.id === passoId);
      const corpo = {
        titulo: data.titulo ?? atual?.titulo,
        descricao: data.descricao ?? atual?.descricao ?? null,
        status: data.status ?? atual?.status ?? 0,
        responsavelId: data.responsavelId ?? atual?.responsavelId ?? null,
        tags: data.tags ?? atual?.tags ?? null,
      };
      const atualizado = await passosApi.atualizarPasso(passoId, corpo);
      setPassos((prev) => prev.map((p) => (p.id === passoId ? atualizado : p)));
      return atualizado;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [passos]);

  const deletarPasso = useCallback(async (passoId) => {
    setLoading(true);
    setErro(null);
    try {
      await passosApi.deletarPasso(passoId);
      setPassos((prev) => prev.filter((p) => p.id !== passoId));
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // Drag-and-drop: SÍNCRONO (PRD §5.3/§8) — aguarda o 200 OK do backend antes de
  // atualizar o estado local. Sem otimismo, sem rollback: se falhar, o estado não
  // se move e o erro fica exposto em `erro` para o chamador exibir um toast.
  const moverPasso = useCallback(async (passoId, novaEtapaId, ordem) => {
    setLoading(true);
    setErro(null);
    try {
      const atualizado = await passosApi.moverPasso(passoId, {
        novaEtapaId,
        ordem: ordem ?? null,
      });
      setPassos((prev) => prev.map((p) => (p.id === passoId ? atualizado : p)));
      return atualizado;
    } catch (e) {
      setErro(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Filtros ---

  const aplicarFiltros = useCallback((novosFiltros) => {
    const merged = { ...filtros, ...novosFiltros };
    setFiltros(merged);
    return fetchPassos(merged);
  }, [filtros, fetchPassos]);

  const limparFiltros = useCallback(() => {
    setFiltros(FILTROS_PADRAO);
    return fetchPassos(FILTROS_PADRAO);
  }, [fetchPassos]);

  return (
    <KanbanContext.Provider
      value={{
        pipelineId,
        etapas,
        passos,
        filtros,
        loading,
        erro,
        fetchEtapas,
        fetchPassos,
        criarEtapa,
        editarEtapa,
        deletarEtapa,
        criarPasso,
        editarPasso,
        deletarPasso,
        moverPasso,
        aplicarFiltros,
        limparFiltros,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban deve ser usado dentro de um KanbanProvider');
  }
  return context;
}
