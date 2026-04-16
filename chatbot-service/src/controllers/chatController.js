const chatModel = "claude-sonnet-4-6";

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

async function generateReply(systemPrompt, userPrompt) {
  const baseURL = process.env.ANTHROPIC_BASE_URL || "https://1gw.gwai.cloud";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY không được set trong .env");
  }

  const response = await fetch(`${baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: chatModel,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Claude API error:", data);
    throw new Error(JSON.stringify(data));
  }

  return data.content?.[0]?.text || "Xin lỗi, tôi chưa thể trả lời.";
}

const CHAT_SYSTEM =
  "Bạn là trợ lý AI thân thiện của ChatWave. Trả lời bằng tiếng Việt, ngắn gọn và hữu ích.";

const SYSTEM_COMMAND_PATTERNS = [
  /\btối ưu\b/i,
  /\boptimize\b/i,
  /\banalyze\s*team\b/i,
  /\bphân tích\s*team\b/i,
  /\bphân tích\s*nhóm\b/i,
  /\bAI\s+(tối ưu|phân tích)\b/i,
];

function isSystemCommand(message) {
  const lower = message.toLowerCase();
  return SYSTEM_COMMAND_PATTERNS.some((pattern) => pattern.test(lower));
}

async function fetchAiAnalyze(teamId) {
  const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://localhost:5001";
  const response = await fetch(`${CORE_SERVICE_URL}/api/v1/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId: teamId || null }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`AI Analyze failed: ${error}`);
  }

  return response.json();
}

function formatActionLine(action, index) {
  const type = action.type || action.actionType;
  const taskId = action.task_id || action.taskId;
  const toUser = action.to_user || action.newAssigneeId;
  const reason = action.reason;

  const emoji = {
    REASSIGN_TASK: "🔄",
    BLOCK_ASSIGNMENT: "🚫",
    DELAY_TASK: "⏰",
    PRIORITIZE_TASK: "⭐",
  }[type] || "•";

  const labels = {
    REASSIGN_TASK: `Chuyển task #${taskId} → ${toUser}`,
    BLOCK_ASSIGNMENT: `Khóa assignment ${toUser}`,
    DELAY_TASK: `Hoãn deadline task #${taskId}`,
    PRIORITIZE_TASK: `Ưu tiên task #${taskId} → ${action.priority}`,
  }[type] || type;

  let line = `${emoji} ${labels}`;
  if (reason) {
    line += ` (${reason})`;
  }
  return line;
}

function formatAiSuggestions(result) {
  const {
    actions = [],
    validActions = [],
    executed = [],
    rejectedActions = [],
  } = result;

  const lines = ["📊 AI Analysis:\n"];

  const suggestions = validActions.length > 0 ? validActions : actions;
  if (suggestions.length > 0) {
    lines.push("Suggestions:");
    suggestions.forEach((item) => {
      const action = item.action || item;
      lines.push(`• ${formatActionLine(action)}`);
    });
    lines.push("");
  }

  if (executed.length > 0) {
    lines.push("Executed:");
    executed.forEach((item) => {
      const action = item.action || item;
      lines.push(`✓ ${formatActionLine(action)}`);
    });
    lines.push("");
  }

  if (rejectedActions.length > 0) {
    lines.push("Rejected:");
    rejectedActions.forEach((item) => {
      const action = item.action || item;
      lines.push(`✗ ${formatActionLine(action)}`);
    });
  }

  if (suggestions.length === 0 && executed.length === 0 && rejectedActions.length === 0) {
    return "🤷 AI không đưa ra đề xuất nào cho team lúc này.";
  }

  return lines.join("\n");
}

async function createCompletion(req, res) {
  try {
    const { messages, teamId } = req.body || {};
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

    // Check if this is a system command
    if (isSystemCommand(lastContent)) {
      const effectiveTeamId = teamId || "default-team";
      console.log(`[chat] System command detected, calling AI analyze for team: ${effectiveTeamId}`);

      try {
        const analyzeResult = await fetchAiAnalyze(effectiveTeamId);
        const content = formatAiSuggestions(analyzeResult);

        return res.json({
          content,
          role: "assistant",
          type: "ai_analyze",
          result: analyzeResult,
          model: chatModel,
        });
      } catch (err) {
        console.error("[chat] AI Analyze error:", err?.message);
        return res.status(500).json({
          message: "Lỗi khi phân tích team bằng AI",
        });
      }
    }

    // Normal chat flow
    const history = messages.slice(0, -1);
    const historyText = formatHistory(history);

    const userPrompt = `
Lịch sử trò chuyện:
${historyText || "(Không có tin nhắn trước đó)"}

Người dùng vừa nói: "${lastContent}"
Hãy phản hồi tự nhiên, ngắn gọn, thân thiện bằng tiếng Việt.
`;

    const content = await generateReply(CHAT_SYSTEM, userPrompt);

    res.json({
      content,
      role: "assistant",
      type: "chat",
      model: chatModel,
    });
  } catch (err) {
    console.error("[chat] Claude API error:", err?.message);
    let status = 500;
    let message = "Lỗi khi gọi Claude API";

    try {
      const errData = JSON.parse(err.message);
      status = errData.error?.status || 500;
      message = errData.error?.message || err.message;
    } catch (e) {
      message = err.message;
    }

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

    const raw = await generateReply(CREATE_TASKS_SYSTEM, userPrompt);

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
    let status = 500;
    let message = "Lỗi khi tạo task từ AI";

    try {
      const errData = JSON.parse(err.message);
      message = errData.error?.message || err.message;
    } catch (e) {
      message = err.message;
    }

    res.status(status).json({ message });
  }
}

module.exports = {
  createCompletion,
  createTasksFromChat,
  generateReply,
  isSystemCommand,
  fetchAiAnalyze,
  formatAiSuggestions,
};
