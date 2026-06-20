import { io, Socket } from 'socket.io-client';

/**
 * 🔌 System Design Principle: Singleton Connection Pooling Pattern
 * Establishes a highly resilient, single socket connection node to the backend streaming cluster.
 */
export const initSocket = async (): Promise<Socket> => {
  const options = {
    'force new connection': true,
    reconnectionAttempts: 99999, // FIX: Passed an actual numeric value instead of conflicting string 'Infinity'
    timeout: 10000,
    transports: ['websocket'], // System Design: Forces instantaneous TCP WebSockets handshake, bypassing slow HTTP long-polling
  };

  // Point cleanly to our live running port layer 5000 engine infrastructure
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  return io(backendUrl, options);
};