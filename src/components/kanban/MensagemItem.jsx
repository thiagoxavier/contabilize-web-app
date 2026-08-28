export default function MensagemItem({ mensagem }) {
  const data = new Date(mensagem.criadoEm).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="kp-msg">
      <div className="kp-msg-head">
        <span className="kp-msg-autor">{mensagem.usuarioNome}</span>
        <time className="kp-msg-data" dateTime={mensagem.criadoEm}>{data}</time>
      </div>
      <p className="kp-msg-texto">{mensagem.conteudo}</p>
    </div>
  );
}
