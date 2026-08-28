import { useEffect, useRef } from 'react';
import { kanbanSocket, EVENTOS_KANBAN } from '../services/kanbanSocket';

/**
 * Entra no grupo SignalR do plano e encaminha cada evento para o handler
 * homônimo em `handlers` (ex.: { CardMovido: (card) => ... }).
 *
 * Os handlers ficam em um ref atualizado a cada render: o chamador pode passar
 * closures novas sem que a conexão/assinatura seja refeita.
 */
export function useKanbanSocket(planoId, handlers = {}) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!planoId) return undefined;

    let ativo = true;
    const remover = EVENTOS_KANBAN.map((evento) =>
      kanbanSocket.on(evento, (payload) => {
        if (ativo) handlersRef.current[evento]?.(payload);
      })
    );

    kanbanSocket.entrarPlano(planoId).catch((err) => {
      if (ativo) handlersRef.current.onErro?.(err);
    });

    return () => {
      ativo = false;
      remover.forEach((off) => off());
      kanbanSocket.sairPlano(planoId).catch(() => {});
    };
  }, [planoId]);
}
