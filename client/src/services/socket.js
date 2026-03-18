import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8000';

export const socket = io(SOCKET_URL);

socket.on('connect', () => {
  console.log('Socket conectado');
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
