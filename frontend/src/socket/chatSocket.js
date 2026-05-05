import { io } from "socket.io-client";
import { REALTIME_API } from "../utils/apiConfig";

const IS_DEV = import.meta.env.MODE === "development";
const localhostUrl = REALTIME_API.localhost;
const vpsUrl = REALTIME_API.vps;

let socket = null;

/**
 * Test WebSocket server có hoạt động không
 */
async function testWebSocketServer() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Realtime service không có HTTP health endpoint, test bằng fetch đơn giản
    await fetch(localhostUrl, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tìm URL hoạt động và kết nối
 */
async function connectSocket() {
  let targetUrl = localhostUrl;

  if (IS_DEV) {
    const isLocalhostUp = await testWebSocketServer();
    if (!isLocalhostUp) {
      targetUrl = vpsUrl;
      console.warn("[Socket] Localhost unavailable, using VPS:", targetUrl);
    } else {
      console.log("[Socket] Using localhost:", targetUrl);
    }
  } else {
    targetUrl = vpsUrl;
    console.log("[Socket] Using VPS:", targetUrl);
  }

  socket = io(targetUrl, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("[Socket] Reconnected after", attemptNumber, "attempts");
  });

  return socket;
}

// Kết nối ngay khi import
connectSocket();

export function getChatSocket() {
  return socket;
}

// Export để force reconnect
export function reconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectSocket();
  return socket;
}
