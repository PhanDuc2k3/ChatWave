import { io } from "socket.io-client";

const baseUrl =
  (import.meta.env.MODE === "development" && "http://localhost:5002") ||
  import.meta.env.VITE_REALTIME_URL ||
  "http://localhost:5002";

let socket;

export function getChatSocket() {
  if (!socket) {
    socket = io(baseUrl, {
      transports: ["websocket"],
    });
  }
  return socket;
}

