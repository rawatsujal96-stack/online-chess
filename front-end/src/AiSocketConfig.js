import openSocket from 'socket.io-client';

const aiSocket = openSocket(
  "https://onlinechess-ai.onrender.com",
  {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  }
);

export default aiSocket;