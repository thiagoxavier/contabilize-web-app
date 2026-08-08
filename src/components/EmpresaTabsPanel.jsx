import { useState, useEffect } from 'react';
import { Icon } from './icons';
import { empresasTabsApi } from '../utils/empresasTabsApi';

export function EmpresaTabsPanel({ empresaId, empresaNome, activeTab: activeTabProp, hideNav = false, onToast }) {
  const [internalActiveTab, setInternalActiveTab] = useState('anotacoes');
  const activeTab = activeTabProp || internalActiveTab;
  const setActiveTab = setInternalActiveTab;
  const [isLoading, setIsLoading] = useState(false);

  // Estados
  const [anotacoes, setAnotacoes] = useState([]);
  const [novaAnotacao, setNovaAnotacao] = useState('');

  const [atividades, setAtividades] = useState([]);
  const [novaAtividade, setNovaAtividade] = useState('');

  const [emails, setEmails] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  // Loaders
  useEffect(() => {
    if (!empresaId) return;
    setIsLoading(true);
    async function loadData() {
      try {
        if (activeTab === 'anotacoes') {
          const res = await empresasTabsApi.listarAnotacoes(empresaId);
          setAnotacoes(Array.isArray(res) ? res : []);
        } else if (activeTab === 'atividades') {
          const res = await empresasTabsApi.listarAtividades(empresaId);
          setAtividades(Array.isArray(res) ? res : []);
        } else if (activeTab === 'emails') {
          const res = await empresasTabsApi.listarEmails(empresaId);
          setEmails(Array.isArray(res) ? res : []);
        } else if (activeTab === 'arquivos') {
          const res = await empresasTabsApi.listarArquivos(empresaId);
          setArquivos(Array.isArray(res) ? res : []);
        } else if (activeTab === 'documentos') {
          const res = await empresasTabsApi.listarDocumentosContabeis(empresaId);
          setDocumentos(Array.isArray(res) ? res : []);
        }
      } catch (err) {
        onToast?.('Erro ao carregar os dados da aba: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [empresaId, activeTab, onToast]);

  const handleAddAnotacao = async (e) => {
    e.preventDefault();
    if (!novaAnotacao.trim()) return;
    try {
      await empresasTabsApi.criarAnotacao(empresaId, novaAnotacao);
      const res = await empresasTabsApi.listarAnotacoes(empresaId);
      setAnotacoes(Array.isArray(res) ? res : []);
      setNovaAnotacao('');
      onToast?.('Anotação adicionada com sucesso!');
    } catch (err) {
      onToast?.('Erro ao salvar anotação.');
    }
  };

  const handleAddAtividade = async (e) => {
    e.preventDefault();
    if (!novaAtividade.trim()) return;
    try {
      await empresasTabsApi.criarAtividade(empresaId, novaAtividade, new Date().toISOString().slice(0,10), 'Você');
      const res = await empresasTabsApi.listarAtividades(empresaId);
      setAtividades(Array.isArray(res) ? res : []);
      setNovaAtividade('');
      onToast?.('Atividade criada com sucesso!');
    } catch (err) {
      onToast?.('Erro ao criar atividade.');
    }
  };

  const toggleAtividade = async (id) => {
    try {
      await empresasTabsApi.toggleAtividade(empresaId, id);
      const res = await empresasTabsApi.listarAtividades(empresaId);
      setAtividades(Array.isArray(res) ? res : []);
    } catch (err) {
      onToast?.('Erro ao alterar atividade.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await empresasTabsApi.uploadArquivo(empresaId, file);
      const res = await empresasTabsApi.listarArquivos(empresaId);
      setArquivos(Array.isArray(res) ? res : []);
      onToast?.(`Arquivo "${file.name}" enviado!`);
    } catch (err) {
      onToast?.('Erro ao enviar arquivo.');
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: hideNav ? 'none' : '1px solid var(--rule-2)', marginTop: hideNav ? 0 : 24 }}>
      {/* Navegação por Abas (oculta se controlada externamente pelo modal) */}
      {!hideNav && (
        <div style={{ display: 'flex', gap: 12, padding: '0 20px', borderBottom: '1px solid var(--rule-2)', background: '#FAFAFA' }}>
          {[
            { id: 'anotacoes', label: 'Anotações', icon: 'fileText' },
            { id: 'atividades', label: 'Atividades', icon: 'checkSquare' },
            { id: 'emails', label: 'E-mails', icon: 'mail' },
            { id: 'arquivos', label: 'Arquivos', icon: 'folder' },
            { id: 'documentos', label: 'Documentos', icon: 'shield' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--ink-900)' : 'var(--muted)',
                padding: '12px 4px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
              }}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo com altura máxima sincronizada com o modal-body */}
      <div style={{ padding: '16px 24px', maxHeight: '65vh', minHeight: '380px', overflowY: 'auto', position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>Carregando...</span>
          </div>
        )}

        {/* ABA 1: ANOTAÇÕES */}
        {activeTab === 'anotacoes' && (
          <div>
            <form onSubmit={handleAddAnotacao} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input 
                type="text" className="input" placeholder="Escreva uma nova anotação..."
                value={novaAnotacao} onChange={e => setNovaAnotacao(e.target.value)} style={{ flex: 1 }}
              />
              <button type="submit" className="btn primary">Adicionar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {anotacoes.length === 0 && !isLoading && <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhuma anotação.</div>}
              {anotacoes.map(item => (
                <div key={item.id} style={{ padding: 14, background: '#FAFAFA', borderRadius: 8, border: '1px solid var(--rule)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                    <strong>{item.autor}</strong>
                    <span>{item.data}</span>
                  </div>
                  <div style={{ color: 'var(--ink-900)', fontSize: 14 }}>{item.texto}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: ATIVIDADES */}
        {activeTab === 'atividades' && (
          <div>
            <form onSubmit={handleAddAtividade} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input 
                type="text" className="input" placeholder="Nova tarefa ou compromisso..."
                value={novaAtividade} onChange={e => setNovaAtividade(e.target.value)} style={{ flex: 1 }}
              />
              <button type="submit" className="btn primary">Criar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atividades.length === 0 && !isLoading && <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhuma atividade pendente.</div>}
              {atividades.map(item => (
                <div key={item.id} style={{ 
                  padding: 12, background: '#FAFAFA', borderRadius: 8, border: '1px solid var(--rule)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: item.concluida ? 0.6 : 1
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                    <input type="checkbox" checked={item.concluida} onChange={() => toggleAtividade(item.id)} />
                    <span style={{ fontSize: 14, color: 'var(--ink-900)', textDecoration: item.concluida ? 'line-through' : 'none' }}>{item.titulo}</span>
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Prazo: {item.data}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: E-MAILS */}
        {activeTab === 'emails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {emails.length === 0 && !isLoading && <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhum e-mail vinculado.</div>}
            {emails.map(item => (
              <div key={item.id} style={{ padding: 14, background: '#FAFAFA', borderRadius: 8, border: '1px solid var(--rule)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, color: 'var(--ink-900)', marginBottom: 4 }}>
                  <span>{item.assunto}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>{item.data}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>De: {item.de}</div>
              </div>
            ))}
          </div>
        )}

        {/* ABA 4: ARQUIVOS */}
        {activeTab === 'arquivos' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label className="btn secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name="upload" size={15} />
                Enviar Arquivo
                <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {arquivos.length === 0 && !isLoading && <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhum arquivo enviado.</div>}
              {arquivos.map(item => (
                <div key={item.id} style={{ padding: 12, background: '#FAFAFA', borderRadius: 8, border: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name="file" size={18} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{item.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.tamanho} · Enviado em {item.data}</div>
                    </div>
                  </div>
                  <button type="button" className="btn ghost btn-sm" style={{ padding: '4px 8px', fontSize: 12 }}>Download</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div>
            {documentos.length === 0 && !isLoading && <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12 }}>Nenhum documento contábil disponível.</div>}
            {documentos.length > 0 && (
              <table className="table" style={{ background: '#fff' }}>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Competência</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map(item => (
                    <tr key={item.id}>
                      <td><strong>{item.tipo}</strong></td>
                      <td>{item.competencia}</td>
                      <td>{item.valor}</td>
                      <td>
                        <span className="tag-cat" style={{ color: 'var(--green-deep)', background: 'rgba(19,161,112,.06)' }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
