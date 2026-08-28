import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../utils/api';

// O hub está fora de /api: https://host/api  ->  https://host/hub/kanban
const HUB_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/hub/kanban`;

let connection = null;
let conectando = null;

function obterConexao() {
  if (connection) return connection;
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem('auth_token') || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
  return connection;
}

export const kanbanSocket = {
  /** Idempotente: várias chamadas concorrentes compartilham a mesma promessa. */
  async conectar() {
    const conn = obterConexao();
    if (conn.state === signalR.HubConnectionState.Connected) return conn;
    if (!conectando) {
      conectando = conn.start().finally(() => { conectando = null; });
    }
    await conectando;
    return conn;
  },

  async desconectar() {
    if (connection) {
      await connection.stop();
      connection = null;
    }
  },

  async entrarPlano(planoId) {
    const conn = await this.conectar();
    await conn.invoke('JoinPlano', planoId);
  },

  async sairPlano(planoId) {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('LeavePlano', planoId);
    }
  },

  /** Registra um handler; devolve a função que o remove. */
  on(evento, handler) {
    const conn = obterConexao();
    conn.on(evento, handler);
    return () => conn.off(evento, handler);
  },
};

export const EVENTOS_KANBAN = Object.freeze([
  'ColunaCriada',
  'ColunaAtualizada',
  'ColunaDeletada',
  'CardCriado',
  'CardAtualizado',
  'CardMovido',
  'CardDeletado',
  'MensagemAdicionada',
]);
