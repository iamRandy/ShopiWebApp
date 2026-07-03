import { io } from "socket.io-client";
import { API_URL, onTokenRefreshed } from "./api";

let socket = null;

const createSocket = () => {
  const instance = io(API_URL, {
    autoConnect: false,
    auth: { token: localStorage.getItem("authToken") },
  });
  return instance;
};

export const getSocket = () => {
  if (!socket) socket = createSocket();
  return socket;
};

export const connectSocket = () => {
  const instance = getSocket();
  if (!instance.connected) instance.connect();
  return instance;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
};

export const updateSocketAuthToken = (token) => {
  if (!socket) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect();
    socket.connect();
  }
};

// Keep the live socket connection authenticated across silent token refreshes.
onTokenRefreshed((token) => updateSocketAuthToken(token));
