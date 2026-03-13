# Chatbot Service

ChatWave AI chatbot microservice sử dụng Groq API.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` từ `.env.example` và điền `GROQ_API_KEY`:

```
PORT=5003
GROQ_API_KEY=your_groq_api_key
```

## Chạy

```bash
# Development
npm run dev

# Production
npm start
```

Service chạy mặc định trên port **5003**.

## API

### POST /api/v1/chat/completions

Gửi tin nhắn và nhận phản hồi từ AI.

**Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Xin chào" }
  ],
  "model": "llama-3.3-70b-versatile",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "content": "...",
  "role": "assistant",
  "model": "llama-3.3-70b-versatile",
  "usage": { ... }
}
```

## Frontend

Frontend gọi `http://localhost:5003/api/v1` mặc định. Có thể đổi qua biến môi trường:

```
VITE_CHATBOT_API_URL=http://localhost:5003/api/v1
```
