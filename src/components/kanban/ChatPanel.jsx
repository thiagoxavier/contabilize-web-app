import { useEffect, useRef, useState } from 'react';
import { kanbanService } from '../../services/kanbanService';
import { kanbanSocket } from '../../services/kanbanSocket';
import MensagemItem from './MensagemItem';

export default function ChatPanel({ cardId, onToast }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const fimRef = useRef(null);

  const adicionar = (msg) =>
    setMensagens((atual) => (atual.some((m) => m.id === msg.id) ? atual : [...atual, msg]));

  // O painel é remontado a cada card aberto, então `carregando` começa true e só cai para false.
  useEffect(() => {
    let ativo = true;
    kanbanService.listarMensagens(cardId)
      .then((lista) => { if (ativo) setMensagens(lista); })
      .catch((err) => { if (ativo) onToast?.(err.message || 'Não foi possível carregar os comentários.'); })
      .finally(() => { if (ativo) setCarregando(false); });

    // Comentários de outros usuários chegam pelo grupo do plano; filtramos pelo card aberto.
    const off = kanbanSocket.on('MensagemAdicionada', (msg) => {
      if (ativo && msg.cardId === cardId) adicionar(msg);
    });
    return () => { ativo = false; off(); };
  }, [cardId, onToast]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'nearest' });
  }, [mensagens.length]);

  const enviar = async (e) => {
    e?.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo) return;
    try {
      adicionar(await kanbanService.criarMensagem(cardId, conteudo));
      setTexto('');
    } catch (err) {
      onToast?.(err.message || 'Não foi possível enviar o comentário.');
    }
  };

  return (
    <section className="kp-chat" aria-label="Comentários do card">
      <h4>Comentários</h4>
      <div className="kp-chat-list">
        {carregando ? (
          <div className="kp-chat-vazio">Carregando…</div>
        ) : mensagens.length === 0 ? (
          <div className="kp-chat-vazio">Nenhum comentário ainda.</div>
        ) : (
          mensagens.map((m) => <MensagemItem key={m.id} mensagem={m} />)
        )}
        <div ref={fimRef} />
      </div>
      <div className="kp-chat-form">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') enviar(e);
          }}
          placeholder="Escreva um comentário…"
          aria-label="Novo comentário"
        />
        <button type="button" className="btn primary btn-sm" onClick={enviar} disabled={!texto.trim()}>Enviar</button>
      </div>
    </section>
  );
}
