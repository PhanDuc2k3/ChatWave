import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// Metric chi tiết cho flow message
export const loginDuration = new Trend('login_duration', true);
export const getMessagesDuration = new Trend('get_messages_duration', true);
export const postMessageDuration = new Trend('post_message_duration', true);
export const messagesSent = new Counter('messages_sent');

// Cấu hình: tập trung load vào message
// Có thể override bằng --vus, --duration
export const options = {
  vus: 50,
  duration: '30s',
};

// Base URL (mặc định localhost, override bằng BASE_URL)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001/api/v1';

// Tài khoản test
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

// Login 1 lần trong setup
function login() {
  const url = `${BASE_URL}/auth/login`;
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  loginDuration.add(res.timings.duration);

  check(res, {
    'login status 200': (r) => r.status === 200,
  });

  let token = null;
  let userId = null;

  try {
    const body = res.json();
    token = body.token || body.accessToken;
    if (body.user) {
      userId = body.user.id || body.user._id;
    }
  } catch (e) {
    // ignore
  }

  if (!token || !userId) {
    check(null, {
      'login trả về token & userId hợp lệ': () => false,
    });
  }

  return { token, userId };
}

// Lấy danh sách conversation và chọn 1 cái để bắn message
function pickConversation(token, userId) {
  const url = `${BASE_URL}/chats/conversations?userId=${encodeURIComponent(
    String(userId),
  )}`;

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.get(url, params);

  check(res, {
    'GET conversations status 200 (setup)': (r) => r.status === 200,
  });

  try {
    const items = res.json();
    if (Array.isArray(items) && items.length > 0) {
      const first = items[0];
      return first.id || first._id || first.conversationId || null;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

// GET messages của 1 conversation
function getMessages(token, conversationId) {
  const url = `${BASE_URL}/chats/${encodeURIComponent(
    String(conversationId),
  )}/messages`;

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.get(url, params);
  getMessagesDuration.add(res.timings.duration);

  check(res, {
    'GET messages status 200': (r) => r.status === 200,
  });

  return res;
}

// POST message (text) vào conversation
function postMessage(token, conversationId, userId) {
  const url = `${BASE_URL}/chats/${encodeURIComponent(
    String(conversationId),
  )}/messages`;

  const payload = JSON.stringify({
    senderId: String(userId),
    senderName: 'k6 MsgUser',
    text: `k6 message at ${new Date().toISOString()}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.post(url, payload, params);
  postMessageDuration.add(res.timings.duration);

  check(res, {
    'POST message status 201': (r) => r.status === 201,
  });

  if (res.status === 201) {
    messagesSent.add(1);
  }

  return res;
}

// setup: login 1 lần + chọn conversation dùng chung
export function setup() {
  const { token, userId } = login();

  if (!token || !userId) {
    return { token: null, userId: null, conversationId: null };
  }

  const conversationId = pickConversation(token, userId);

  return { token, userId, conversationId };
}

// default: tập trung load GET/POST messages
export default function (data) {
  const { token, userId, conversationId } = data || {};

  if (!token || !userId || !conversationId) {
    return;
  }

  // 1. GET messages
  getMessages(token, conversationId);

  sleep(0.5);

  // 2. POST message
  postMessage(token, conversationId, userId);

  sleep(0.5);
}

