import { useState } from 'react';
import { Icon } from './icons';

export function ClienteDetalhesModal({ cliente, onClose, onToast }) {
  const [activeTab, setActiveTab] = useState('anotacoes');

  // Estados locais para interatividade rápida das abas
  const [anotacoes, setAnotacoes] = useState([
    { id: 1, autor: 'Atendente Silva', data: '2026-08-05 14:30', texto: 'Cliente solicitou atualização da apólice de frotas.' },
    { id: 2, autor: 'Gerente Contábil', data: '2026-08-01 10:15', texto: 'Documentos do DRE relativos ao mês anterior recebidos.' }
  ]);
  const [novaAnotacao, setNovaAnotacao] = useState('');

  const [atividades, setAtividades] = useState([
    { id: 1, titulo: 'Renovação do seguro de vida empresarial', data: '2026-08-10', concluida: false, responsavel: 'Carlos' },
    { id: 2, titulo: 'Enviar balancete assinado', data: '2026-08-03', concluida: true, responsavel: 'Mariana' }
  ]);
  const [novaAtividade, setNovaAtividade] = useState('');

  const [emails] = useState([
    { id: 1, assunto: 'Confirmação de recebimento DAS', data: '2026-08-02 09:00', de: 'financeiro@contabilize.com.br' },
    { id: 2, assunto: 'Proposta de Seguro Auto Individual', data: '2026-07-28 16:45', de: 'atendimento@contabilize.com.br' }
  ]);

  const [arquivos, setArquivos] = useState([
    { id: 1, nome: 'contrato_social_consolidado.pdf', tamanho: '2.4 MB', data: '2026-01-15' },
    { id: 2, nome: 'cartao_cnpj.pdf', tamanho: '450 KB', data: '2026-01-15' }
  ]);

  const [documentos] = useState([
    { id: 1, tipo: 'DAS', competencia: '07/2026', valor: 'R$ 1.450,00', status: 'Disponível' },
    { id: 2, tipo: 'DRE', competencia: '06/2026', valor: '-', status: 'Enviado' }
  ]);

  if (!cliente) return null;

  const handleAddAnotacao = (e) => {
    e.preventDefault();
    if (!novaAnotacao.trim()) return;
    const item = {
      id: Date.now(),
      autor: cliente.nome || 'Usuário Atual',
      data: new Date().toISOString().replace('T', ' ').slice(0, 16),
      texto: novaAnotacao
    };
    setAnotacoes([item, ...anotacoes]);
    setNovaAnotacao('');
    onToast?.('Anotação adicionada com sucesso!');
  };

  const handleAddAtividade = (e) => {
    e.preventDefault();
    if (!novaAtividade.trim()) return;
    const item = {
      id: Date.now(),
      titulo: novaAtividade,
      data: new Date().toISOString().slice(0, 10),
      concluida: false,
      responsavel: 'Você'
    };
    setAtividades([item, ...atividades]);
    setNovaAtividade('');
    onToast?.('Atividade criada com sucesso!');
  };

  const toggleAtividade = (id) => {
    setAtividades(atividades.map(a => a.id === id ? { ...a, concluida: !a.concluida } : a));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item = {
      id: Date.now(),
      nome: file.name,
      tamanho: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      data: new Date().toISOString().slice(0, 10)
    };
    setArquivos([item, ...arquivos]);
    onToast?.(`Arquivo "${file.name}" enviado!`);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 850, width: '92vw', padding: 0, overflow: 'hidden' }}>
        
        {/* Header Estilizado inspirado no Protótipo */}
        <div style={{ background: 'var(--ink-900)', color: '#fff', padding: '24px 28px 16px', position: 'relative' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
          >
            <Icon name="x" size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'var(--gold)',
              color: '#0B1B26', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 20
            }}>
              {(cliente.nome || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}>
                Detalhes do Cliente / Empresa
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '2px 0 4px', color: '#fff' }}>{cliente.nome}</h2>
              <div style={{ fontSize: 13, opacity: 0.8, display: 'flex', gap: 12 }}>
                <span><strong>E-mail:</strong> {cliente.email}</span>
                {cliente.telefone && <span>· <strong>Tel:</strong> {cliente.telefone}</span>}
                {cliente.cargo && <span>· <strong>Cargo:</strong> {cliente.cargo}</span>}
              </div>
            </div>
          </div>

          {/* Navegação por Abas */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.7)',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s'
                }}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div style={{ padding: 24, minHeight: 320, background: 'var(--paper)' }}>
          
          {/* ABA 1: ANOTAÇÕES */}
          {activeTab === 'anotacoes' && (
            <div>
              <form onSubmit={handleAddAnotacao} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input 
                  type="text" 
                  className="input"
                  placeholder="Escreva uma nova anotação sobre o cliente..."
                  value={novaAnotacao}
                  onChange={e => setNovaAnotacao(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn primary">Adicionar</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {anotacoes.map(item => (
                  <div key={item.id} style={{ padding: 14, background: '#fff', borderRadius: 8, border: '1px solid var(--rule)' }}>
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
                  type="text" 
                  className="input"
                  placeholder="Nova tarefa ou compromisso com o cliente..."
                  value={novaAtividade}
                  onChange={e => setNovaAtividade(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn primary">Criar Atividade</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atividades.map(item => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--rule)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      textDecoration: item.concluida ? 'line-through' : 'none', opacity: item.concluida ? 0.6 : 1
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={item.concluida} 
                        onChange={() => toggleAtividade(item.id)}
                      />
                      <span style={{ fontSize: 14, color: 'var(--ink-900)' }}>{item.titulo}</span>
                    </label>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Prazo: {item.data}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: E-MAILS */}
          {activeTab === 'emails' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {emails.map(item => (
                  <div key={item.id} style={{ padding: 14, background: '#fff', borderRadius: 8, border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, color: 'var(--ink-900)', marginBottom: 4 }}>
                      <span>{item.assunto}</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>{item.data}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>De: {item.de}</div>
                  </div>
                ))}
              </div>
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
                {arquivos.map(item => (
                  <div key={item.id} style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name="file" size={18} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-900)' }}>{item.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.tamanho} · Enviado em {item.data}</div>
                      </div>
                    </div>
                    <button type="button" className="btn secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 5: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div>
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
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
