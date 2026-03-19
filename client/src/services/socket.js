import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000';
};

const SOCKET_URL = getSocketUrl();
console.log('Socket URL:', SOCKET_URL);

const socketInstance = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  reconnectionDelayMax: 5000
});

socketInstance.on('connect', () => {
  console.log('Socket connected:', socketInstance.id);
});

socketInstance.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
});

export const socket = socketInstance;

export const joinAdmin = () => {
  socket.emit('join-admin');
};

export const joinMesa = (mesaId) => {
  socket.emit('join-mesa', mesaId);
};

export const solicitarMozo = (mesaId, numeroMesa) => {
  socket.emit('solicitar-mozo', { mesaId, numeroMesa });
};

export const pedirCuenta = (mesaId, numeroMesa, pedidoId) => {
  socket.emit('pedir-cuenta', { mesaId, numeroMesa, pedidoId });
};

export default socket;
