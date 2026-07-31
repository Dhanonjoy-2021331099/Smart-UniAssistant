import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
  } else if (socket.auth?.token !== token) {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
