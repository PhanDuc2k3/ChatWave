import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Metric custom để theo dõi thời gian response từng bước chính
export const loginDuration = new Trend('login_duration', true);
export const conversationsDuration = new Trend('conversations_duration', true);
export const getMessagesDuration = new Trend('get_messages_duration', true);
export const postMessageDuration = new Trend('post_message_duration', true);

// Cấu hình test:
// - 100 virtual users (VU)
// - Chạy trong 30 giây
export const options = {
  vus: 100,
  duration: '30s',
  // Có thể bật threshold khi muốn dùng trong pipeline CI/CD:
  // thresholds: {
  //   http_req_failed: ['rate<0.01'],      // < 1% request được phép fail
  //   http_req_duration: ['p(95)<500'],    // 95% request < 500ms
  // },
};

// Base URL cho core-service
// Mặc định: http://localhost:5001/api/v1
// Có thể override bằng biến môi trường:
//   k6 run k6-core-chat-flow.js -e BASE_URL=http://localhost:5001/api/v1
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001/api/v1';

// Tài khoản test mẫu (phải tồn tại trong DB)
// Có thể override qua env:
//   -e TEST_EMAIL="..." -e TEST_PASSWORD="..."
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

// Hàm login: POST /api/v1/auth/login
// Trả về { token, userId } để dùng cho các API cần auth
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
    // authService.login trả về: { user, accessToken, refreshToken, token }
    token = body.token || body.accessToken;
    if (body.user) {
      userId = body.user.id || body.user._id;
    }
  } catch (e) {
    // bỏ qua, sẽ fail check phía dưới nếu thiếu token/userId
  }

  if (!token || !userId) {
    check(null, {
      'login trả về token & userId hợp lệ': () => false,
    });
  }

  return { token, userId };
}

// Hàm lấy danh sách cuộc trò chuyện:
// GET /api/v1/chats/conversations?userId=...
function getConversations(token, userId) {
  const url = `${BASE_URL}/chats/conversations?userId=${encodeURIComponent(
    String(userId),
  )}`;

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.get(url, params);
  conversationsDuration.add(res.timings.duration);

  check(res, {
    'GET conversations status 200': (r) => r.status === 200,
  });

  let conversations = [];
  try {
    conversations = res.json();
  } catch (e) {
    conversations = [];
  }

  return conversations;
}

// Hàm lấy message của một cuộc trò chuyện:
// GET /api/v1/chats/:conversationId/messages
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

// Hàm gửi message mới:
// POST /api/v1/chats/:conversationId/messages
// chatService.sendMessage yêu cầu:
//   - conversationId (trong URL)
//   - payload.senderId (bắt buộc)
//   - (text hoặc imageUrl) (ít nhất 1 field)
function postMessage(token, conversationId, userId) {
  const url = `${BASE_URL}/chats/${encodeURIComponent(
    String(conversationId),
  )}/messages`;

  const payload = JSON.stringify({
    senderId: String(userId),
    senderName: 'k6 User',
    text: 'Hello from k6 load test',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.post(url, payload, params);
  postMessageDuration.add(res.timings.duration);

  // sendMessage đang trả về status 201
  check(res, {
    'POST message status 201': (r) => r.status === 201,
  });

  return res;
}

// setup(): chạy 1 lần trước khi test, login 1 lần duy nhất
// và share token + userId cho tất cả VU
export function setup() {
  const { token, userId } = login();

  return { token, userId };
}

// Hàm default: flow mô phỏng 1 user thật
// 1. Dùng lại token + userId từ setup()
// 2. GET conversations
// 3. Chọn 1 conversation (nếu có)
// 4. GET messages của conversation đó
// 5. POST message mới vào conversation
// Có sleep giữa các bước để realistic hơn
export default function (data) {
  const token = data.token;
  const userId = data.userId;

  if (!token || !userId) {
    return;
  }

  sleep(1);

  const conversations = getConversations(token, userId);

  sleep(1);

  if (!conversations || conversations.length === 0) {
    // Không có cuộc trò chuyện nào => không test thêm messages
    return;
  }

  // Chọn conversation đầu tiên
  const firstConv = conversations[0];
  const conversationId =
    firstConv.id || firstConv._id || firstConv.conversationId;

  if (!conversationId) {
    return;
  }

  getMessages(token, conversationId);

  sleep(1);

  postMessage(token, conversationId, userId);

  sleep(1);
}

