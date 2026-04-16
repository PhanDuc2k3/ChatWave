// k6-chat-load.js
// Usage example:
// k6 run k6-chat-load.js \
//   -e BASE_URL=https://api.chatwave.site/api/v1 \
//   -e NUM_USERS=50 \
//   -e VUS=50 \
//   -e DURATION=30s

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

export const getMessagesDuration = new Trend('get_messages_duration', true);
export const postMessageDuration = new Trend('post_message_duration', true);
export const largeResponses = new Counter('large_responses');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001/api/v1';
const NUM_USERS = Number(__ENV.NUM_USERS || 50);
const VUS = Number(__ENV.VUS || 50);
const DURATION = __ENV.DURATION || '30s';

export const options = {
  vus: VUS,
  duration: DURATION,
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loginUser(i) {
  const email = `user${i}@test.com`;
  const password = '123123';

  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'login status 200': (r) => r.status === 200,
  });

  let token = null;
  let userId = null;
  try {
    const body = res.json();
    token = body.token || body.accessToken;
    userId = body.user && (body.user.id || body.user._id);
  } catch (e) {
    // ignore
  }

  check(token, { 'token exists': (t) => !!t });
  check(userId, { 'userId exists': (id) => !!id });

  return { token, userId };
}

function fetchConversations(token, userId) {
  const res = http.get(
    `${BASE_URL}/chats/conversations?userId=${encodeURIComponent(
      String(userId)
    )}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  check(res, {
    'GET conversations status 200': (r) => r.status === 200,
  });

  if (res.body && res.body.length > 100_000) {
    largeResponses.add(1);
  }

  let items = [];
  try {
    items = res.json();
  } catch (e) {
    items = [];
  }

  return items;
}

function fetchMessagesPage(token, conversationId, cursor) {
  let query = 'limit=20';
  if (cursor) {
    query += `&before=${encodeURIComponent(String(cursor))}`;
  }

  const url = `${BASE_URL}/chats/${encodeURIComponent(
    String(conversationId),
  )}/messages?${query}`;

  const res = http.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  getMessagesDuration.add(res.timings.duration);

  check(res, {
    'GET messages status 200': (r) => r.status === 200,
  });

  if (res.body && res.body.length > 100_000) {
    largeResponses.add(1);
  }

  let payload = { items: [], pageInfo: {} };
  try {
    payload = res.json();
  } catch (e) {
    // ignore
  }

  return payload;
}

function sendMessage(token, conversationId, userId) {
  const url = `${BASE_URL}/chats/${encodeURIComponent(
    String(conversationId),
  )}/messages`;

  const payload = JSON.stringify({
    senderId: String(userId),
    text: `load test message at ${new Date().toISOString()}`,
  });

  const res = http.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  postMessageDuration.add(res.timings.duration);

  check(res, {
    'POST message status 201': (r) => r.status === 201,
  });

  if (res.body && res.body.length > 100_000) {
    largeResponses.add(1);
  }

  return res;
}

export function setup() {
  const authData = [];

  for (let i = 1; i <= NUM_USERS; i++) {
    const { token, userId } = loginUser(i);
    authData.push({ token, userId });
  }

  return { authData };
}

export default function (data) {
  const authData = data.authData;
  if (!authData || authData.length === 0) {
    return;
  }

  const userIndex = ((__VU - 1) % authData.length);
  const { token, userId } = authData[userIndex];

  if (!token || !userId) {
    return;
  }

  const conversations = fetchConversations(token, userId);
  if (!Array.isArray(conversations) || conversations.length === 0) {
    sleep(randomInt(1, 3));
    return;
  }

  const conv = conversations[randomInt(0, conversations.length - 1)];
  const conversationId = conv.id || conv._id || conv.conversationId;
  if (!conversationId) {
    sleep(randomInt(1, 3));
    return;
  }

  const firstPage = fetchMessagesPage(token, conversationId, null);

  if (Math.random() < 0.2 && firstPage.pageInfo && firstPage.pageInfo.nextCursor) {
    fetchMessagesPage(token, conversationId, firstPage.pageInfo.nextCursor);
  }

  if (Math.random() < 0.2) {
    sendMessage(token, conversationId, userId);
  }

  sleep(randomInt(1, 3));
}

