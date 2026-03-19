import { io } from 'socket.io-client';

let socket = null;

const getSocketUrl = () => {
  if (typeof import !== 'undefined' && import.meta?.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) {
    return window.__ENV__.VITE_API_URL;
  }
  return 'http://localhost:8000';
};

export const getSocket = () => {
  if (!socket) {
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
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
  }
  return socket;
};

export const socket = getSocket();

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

export const joinAdmin = () => {
  console.log('Joining admin room, socket connected:', socket.connected);
  socket.emit('join-admin');
};

export const joinMesa = (mesaId) => {
  console.log('Joining mesa room:', mesaId, 'socket connected:', socket.connected);
  socket.emit('join-mesa', mesaId);
};

export const solicitarMozo = (mesaId, numeroMesa) => {
  console.log('Emitting solicitar-mozo:', { mesaId, numeroMesa });
  socket.emit('solicitar-mozo', { mesaId, numeroMesa });
};

export const pedirCuenta = (mesaId, numeroMesa, pedidoId) => {
  console.log('Emitting pedir-cuenta:', { mesaId, numeroMesa, pedidoId });
  socket.emit('pedir-cuenta', { mesaId, numeroMesa, pedidoId });
};

export default socket;
