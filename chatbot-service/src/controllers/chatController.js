const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 90000,
});

const chatModel = "llama-3.3-70b-versatile";

function formatHistory(messages) {
  if (!messages || !Array.isArray(messages)) return "(Không có tin nhắn trước đó)";
  return messages
    .map((m) => {
      const prefix = m.role === "user" ? "👤" : "🤖";
      return `${prefix} ${String(m.content || "").trim()}`;
    })
    .filter((s) => s.length > 1)
    .join("\n");
}

async function generateReply(systemPrompt, userPrompt, temperature = 0.3, maxTokens = 300) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: chatModel,
    temperature,
    max_tokens: maxTokens,
  });
  return chatCompletion.choices?.[0]?.message?.content || "Xin lỗi, tôi chưa thể trả lời.";
}

const CHAT_SYSTEM =
  "Bạn là trợ lý AI thân thiện của ChatWave. Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.";

async function createCompletion(req, res) {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: "messages là mảng bắt buộc và không được rỗng",
      });
    }

    const lastUser = messages.filter((m) => m.role === "user").pop();
    const lastContent = lastUser ? String(lastUser.content || "").trim() : "";
    if (!lastContent) {
      return res.status(400).json({ message: "Tin nhắn không được rỗng" });
    }

    const history = messages.slice(0, -1);
    const historyText = formatHistory(history);

    const userPrompt = `
Lịch sử trò chuyện:
${historyText || "(Không có tin nhắn trước đó)"}

Người dùng vừa nói: "${lastContent}"
Hãy phản hồi tự nhiên, ngắn gọn, thân thiện bằng tiếng Việt.
`;

    const content = await generateReply(CHAT_SYSTEM, userPrompt, 0.3, 500);

    res.json({
      content,
      role: "assistant",
      model: chatModel,
    });
  } catch (err) {
    console.error("[chat] Groq API error:", err?.message);
    const status = err?.status || 500;
    const message = err?.error?.message || err?.message || "Lỗi khi gọi Groq API";
    res.status(status).json({ message });
  }
}

const CREATE_TASKS_SYSTEM = `Bạn là trợ lý tạo task cho ChatWave. Dựa vào cuộc hội thoại, tạo danh sách task JSON.
Quy tắc:
- Trả về DUY NHẤT JSON array, không text khác.
- Format: [{"title":"...","description":"...","expectedResults":["..."],"acceptanceCriteria":["..."],"dueDate":"","priority":"medium","estimatedEffort":""}]
- Chia nhỏ công việc thành nhiều task.`;

async function createTasksFromChat(req, res) {
  try {
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        message: "messages là mảng bắt buộc và không được rỗng",
      });
    }

    const historyText = formatHistory(messages);
    const userPrompt = `
Lịch sử trò chuyện:
${historyText}

Dựa vào cuộc hội thoại trên, tạo danh sách task JSON. Chỉ trả về JSON array, không giải thích.
`;

    const raw = await generateReply(CREATE_TASKS_SYSTEM, userPrompt, 0.2, 1500);

    let tasks = [];
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    try {
      if (arrayMatch) {
        const parsed = JSON.parse(arrayMatch[0]);
        tasks = Array.isArray(parsed) ? parsed : [];
      } else if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
      }
    } catch {
      // ignore parse error
    }

    res.json({ tasks });
  } catch (err) {
    console.error("[chat] createTasksFromChat error:", err?.message);
    const status = err?.status || 500;
    const message = err?.error?.message || err?.message || "Lỗi khi tạo task từ AI";
    res.status(status).json({ message });
  }
}

module.exports = {
  createCompletion,
  createTasksFromChat,
};
