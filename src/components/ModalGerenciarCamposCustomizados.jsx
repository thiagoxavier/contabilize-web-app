import { useState, useEffect } from 'react';
import { usuariosApi } from '../utils/usuariosApi';
import { Icon } from './icons';

export function ModalGerenciarCamposCustomizados({ onClose, onSaveSuccess, onToast }) {
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Texto');
  const [opcoes, setOpcoes] = useState('');
  const [obrigatorio, setObrigatorio] = useState(false);

  useEffect(() => {
    loadCampos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function loadCampos() {
    setLoading(true);
    try {
      const data = await usuariosApi.listarCamposCustomizados();
      setCampos(data || []);
    } catch (err) {
      onToast?.(err.message || 'Erro ao carregar campos customizados.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setNome('');
    setTipo('Texto');
    setOpcoes('');
    setObrigatorio(false);
  }

  function handleStartEdit(c) {
    setEditingId(c.id);
    setNome(c.nome || '');
    setTipo(c.tipo || 'Texto');
    setOpcoes(Array.isArray(c.opcoes) ? c.opcoes.join(', ') : (c.opcoes || ''));
    setObrigatorio(!!c.obrigatorio);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const dto = {
        nome: nome.trim(),
        tipo,
        opcoes: tipo === 'Selecao' ? opcoes.split(',').map(o => o.trim()).filter(Boolean) : null,
        obrigatorio,
      };

      if (editingId) {
        await usuariosApi.atualizarCampoCustomizado(editingId, dto);
        onToast?.('Campo customizado atualizado com sucesso.');
      } else {
        await usuariosApi.salvarCampoCustomizado(dto);
        onToast?.('Campo customizado criado com sucesso.');
      }
      resetForm();
      await loadCampos();
      onSaveSuccess?.();
    } catch (err) {
      onToast?.(err.message || 'Erro ao salvar campo customizado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Este campo deixará de aparecer nos formulários. Os dados já preenchidos por usuários não serão apagados. Deseja continuar?')) return;
    setLoading(true);
    try {
      await usuariosApi.excluirCampoCustomizado(id);
      onToast?.('Campo desativado com sucesso.');
      if (editingId === id) resetForm();
      await loadCampos();
      onSaveSuccess?.();
    } catch (err) {
      onToast?.(err.message || 'Erro ao excluir campo customizado.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(index, direction) {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= campos.length) return;
    setLoading(true);
    try {
      const reordered = [...campos];
      const temp = reordered[index];
      reordered[index] = reordered[nextIdx];
      reordered[nextIdx] = temp;
      setCampos(reordered);

      const idsEmOrdem = reordered.map(c => c.id);
      await usuariosApi.reordenarCamposCustomizados(idsEmOrdem);
      onSaveSuccess?.();
    } catch (err) {
      onToast?.(err.message || 'Erro ao reordenar campos.');
      await loadCampos();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Gerenciamento de Campos Customizados</h3>
            <div className="sub">Crie e organize campos adicionais para os formulários de usuários do tenant.</div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <Icon name="chevDown" size={18} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '340px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Lista de Campos */}
            <div>
              <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--ink-900)' }}>Campos Cadastrados</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {campos.map((c, index) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--rule)',
                      borderRadius: '8px',
                      background: editingId === c.id ? 'var(--gold-soft)' : '#fff',
                      borderColor: editingId === c.id ? 'var(--gold)' : 'var(--rule)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink-900)' }}>
                        {c.nome} {c.obrigatorio && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>*</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                        Tipo: <b>{c.tipo}</b> {c.opcoes && `(${Array.isArray(c.opcoes) ? c.opcoes.join(', ') : c.opcoes})`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '6px' }}>
                        <button
                          type="button"
                          disabled={index === 0 || loading}
                          onClick={() => handleMove(index, -1)}
                          style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--rule)', borderRadius: '4px', background: index === 0 ? '#f0f0f0' : '#fff', cursor: 'pointer' }}
                          title="Subir campo"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === campos.length - 1 || loading}
                          onClick={() => handleMove(index, 1)}
                          style={{ fontSize: '10px', padding: '2px 6px', border: '1px solid var(--rule)', borderRadius: '4px', background: index === campos.length - 1 ? '#f0f0f0' : '#fff', cursor: 'pointer' }}
                          title="Descer campo"
                        >
                          ▼
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="Editar"
                        onClick={() => handleStartEdit(c)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn ghost btn-sm"
                        style={{ padding: '4px 8px', color: 'var(--danger)' }}
                        title="Excluir"
                        onClick={() => handleDelete(c.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {campos.length === 0 && !loading && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    Nenhum campo customizado cadastrado.
                  </div>
                )}
              </div>
            </div>

            {/* Formulário de Criação/Edição */}
            <div style={{ borderLeft: '1px solid var(--rule-2)', paddingLeft: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--ink-900)', margin: 0 }}>
                  {editingId ? 'Editar Campo' : 'Novo Campo Customizado'}
                </h4>
                {editingId && (
                  <button
                    type="button"
                    style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={resetForm}
                  >
                    + Criar Novo
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="field-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Nome do Campo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Código Interno / Matrícula"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Tipo de Dado *</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="Texto">Texto</option>
                    <option value="Numero">Número</option>
                    <option value="Data">Data</option>
                    <option value="Selecao">Seleção (Dropdown)</option>
                    <option value="SimNao">Sim/Não (Checkbox)</option>
                  </select>
                </div>

                {tipo === 'Selecao' && (
                  <div className="field-group">
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Opções (separadas por vírgula) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Opção A, Opção B, Opção C"
                      value={opcoes}
                      onChange={e => setOpcoes(e.target.value)}
                    />
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={obrigatorio}
                    onChange={e => setObrigatorio(e.target.checked)}
                    style={{ accentColor: 'var(--ink-900)' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-900)' }}>Preenchimento Obrigatório</span>
                </label>

                <button type="submit" className="btn primary" disabled={loading} style={{ marginTop: '12px', width: '100%' }}>
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Campo'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <div className="left"></div>
          <div className="right">
            <button className="btn primary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
