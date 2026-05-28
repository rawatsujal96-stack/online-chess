import openSocket from 'socket.io-client';

const socket = openSocket(
  "https://onlinechess-backend.onrender.com",
  {
    transports: ["websocket"],

    reconnection: true,

    reconnectionAttempts: 5,

    reconnectionDelay: 1000,
  }
);

//const socket = openSocket("http://localhost:8080")

export default socket;