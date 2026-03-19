import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000';
};

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Socket conectado:', SOCKET_URL);
});

socket.on('connect_error', (error) => {
  console.log('Socket error:', error.message);
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinAdmin = () => {
  socket.emit('join-admin');
};

export const joinMesa = (mesaId) => {
  socket.emit('join-mesa', mesaId);
};

export const solicitarMozo = (mesaId, numeroMesa) => {
  socket.emit('solicitar-mozo', { mesaId, numeroMesa });
};
