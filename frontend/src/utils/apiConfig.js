/**
 * API Service URLs với fallback: ưu tiên localhost, tự động chuyển sang VPS nếu localhost fail
 */

const IS_DEV = import.meta.env.MODE === "development";

/**
 * Core API URLs
 */
export const CORE_API = {
  localhost: "http://localhost:5001/api/v1",
  localhostBase: "http://localhost:5001",
  vps: import.meta.env.VITE_API_BASE_URL || "https://api.chatwave.site/api/v1",
  get primary() {
    return IS_DEV ? this.localhost : this.vps;
  },
};

/**
 * Realtime (WebSocket) URLs
 */
export const REALTIME_API = {
  localhost: "http://localhost:5002",
  vps: import.meta.env.VITE_REALTIME_URL || "https://ws.chatwave.site",
  get primary() {
    return IS_DEV ? this.localhost : this.vps;
  },
};

/**
 * Chatbot API URLs
 */
export const CHATBOT_API = {
  localhost: "http://localhost:5003/api/v1",
  localhostBase: "http://localhost:5003",
  vps: import.meta.env.VITE_CHATBOT_API_URL || "https://chatbot.chatwave.site/api/v1",
  get primary() {
    return IS_DEV ? this.localhost : this.vps;
  },
};

/**
 * Cache trạng thái fallback
 */
const fallbackCache = {
  core: null,
  realtime: null,
  chatbot: null,
};

/**
 * Test localhost có hoạt động không
 */
async function testLocalhost(service) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let healthUrl;
    if (service === "core") {
      healthUrl = `${CORE_API.localhost}/health`;
    } else if (service === "chatbot") {
      healthUrl = `${CHATBOT_API.localhost}/health`;
    } else {
      healthUrl = REALTIME_API.localhost;
    }

    await fetch(healthUrl, {
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
 * Lấy URL với fallback tự động
 */
export async function getApiUrl(service = "core") {
  if (fallbackCache[service] === true) {
    const urls = { core: CORE_API, realtime: REALTIME_API, chatbot: CHATBOT_API };
    return urls[service].localhost;
  }
  if (fallbackCache[service] === false) {
    const urls = { core: CORE_API, realtime: REALTIME_API, chatbot: CHATBOT_API };
    return urls[service].vps;
  }

  const urls = { core: CORE_API, realtime: REALTIME_API, chatbot: CHATBOT_API };

  if (IS_DEV) {
    const isLocalhostUp = await testLocalhost(service);
    fallbackCache[service] = isLocalhostUp;
    console.log(`[API Config] ${service}: localhost=${isLocalhostUp ? "OK" : "FAIL"}`);
    return isLocalhostUp ? urls[service].localhost : urls[service].vps;
  } else {
    fallbackCache[service] = false;
    return urls[service].vps;
  }
}

/**
 * Reset fallback cache (gọi khi cần retest)
 */
export function resetFallbackCache() {
  fallbackCache.core = null;
  fallbackCache.realtime = null;
  fallbackCache.chatbot = null;
}
