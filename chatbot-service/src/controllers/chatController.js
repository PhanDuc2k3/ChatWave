const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Bạn là trợ lý AI thân thiện của ChatWave. Trả lời bằng tiếng Việt, ngắn gọn và hữu ích. Giúp người dùng với câu hỏi, gợi ý, hoặc trò chuyện thông thường.`;

async function callGroqWithRetry(params, options = {}) {
  const retries = Number(options.retries ?? 2);
  const delayMs = Number(options.delayMs ?? 800);

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await groq.chat.completions.create(params);
    } catch (err) {
      lastError = err;

      const status = err?.status;
      const msg = err?.message || "";
      const isNetworkError =
        msg.toLowerCase().includes("connection error") ||
        msg.toLowerCase().includes("timeout");
      const isServerError = !status || status >= 500;

      if (attempt === retries || (!isNetworkError && !isServerError)) {
        throw err;
      }

      const wait = delayMs * (attempt + 1);
      console.warn(
        `[chat] Groq retry ${attempt + 1}/${retries} after error:`,
        msg || status
      );
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  throw lastError;
}

async function createCompletion(req, res, next) {
  try {
    const { messages } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: "messages là mảng bắt buộc và không được rỗng",
      });
    }

    const model = req.body.model || "llama-3.3-70b-versatile";
    const maxTokens = Math.min(Number(req.body.max_tokens) || 1024, 4096);
    const temperature = Math.min(Math.max(Number(req.body.temperature) || 0.7, 0), 2);

    const mapped = messages
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").trim(),
      }))
      .filter((m) => m.content.length > 0);

    const maxHistory = 20;
    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(mapped.length > maxHistory ? mapped.slice(-maxHistory) : mapped),
    ];

    const completion = await callGroqWithRetry({
      model,
      messages: chatMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const choice = completion.choices?.[0];
    const content = choice?.message?.content || "";

    res.json({
      content,
      role: "assistant",
      model: completion.model,
      usage: completion.usage,
    });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || "Lỗi khi gọi Groq API";
    const groqError = err?.error?.message || err?.response?.data?.error?.message;
    const detail = groqError || err?.toString?.() || "";

    console.error("[chat] Groq API error:", {
      status,
      message,
      groqError,
      detail: err?.error || err?.response?.data,
    });

    res.status(status).json({
      message: groqError || message,
      ...(process.env.NODE_ENV !== "production" && detail ? { detail } : {}),
    });
  }
}

module.exports = {
  createCompletion,
};
