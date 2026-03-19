import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:8000';
};

let socket = null;

const createSocket = () => {
  const SOCKET_URL = getSocketUrl();
  console.log('Creating socket connection to:', SOCKET_URL);
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    reconnectionDelayMax: 5000
  });

  socket.on('connect', () => {
    console.log('Socket connected successfully:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
};

export const socket = getSocket();

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
