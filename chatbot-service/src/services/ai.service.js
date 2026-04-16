// ======================
// IMPORT EXISTING AI WRAPPER
// ======================
const { generateReply } = require("../controllers/chatController");

const MAX_RETRIES = 3;

// ======================
// BUILD PROMPT
// ======================
function buildPrompt(teamData, taskData) {
  const systemPrompt = `Bạn là AI advisor cho hệ thống quản lý task.

Nhiệm vụ: phân tích team và tasks, đưa ra đề xuất hành động tối ưu.

Actions được phép:
- REASSIGN_TASK
- BLOCK_ASSIGNMENT
- DELAY_TASK
- PRIORITIZE_TASK

QUY TẮC:
- KHÔNG trực tiếp thay đổi database
- CHỈ trả về JSON hợp lệ
- KHÔNG được trả bất kỳ text nào ngoài JSON
- KHÔNG giải thích

FORMAT BẮT BUỘC:

{
  "actions": [
    {
      "type": "REASSIGN_TASK",
      "task_id": number,
      "from_user": string,
      "to_user": string,
      "reason": string
    }
  ]
}`;

  const userPrompt = `
Team:
${JSON.stringify(teamData, null, 2)}

Tasks:
${JSON.stringify(taskData, null, 2)}

Phân tích và trả về JSON actions.
`;

  return { systemPrompt, userPrompt };
}

// ======================
// PARSE JSON (SAFE)
// ======================
function parseJsonResponse(text) {
  try {
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.actions || !Array.isArray(parsed.actions)) {
      throw new Error("Missing 'actions'");
    }

    return parsed;
  } catch (err) {
    throw new Error("Parse AI response failed: " + err.message);
  }
}

// ======================
// VALIDATE BASIC
// ======================
function validateActions(actions) {
  const validTypes = [
    "REASSIGN_TASK",
    "BLOCK_ASSIGNMENT",
    "DELAY_TASK",
    "PRIORITIZE_TASK",
  ];

  return actions.filter((a) => {
    return a.type && validTypes.includes(a.type);
  });
}

// ======================
// RETRY HELPER
// ======================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ======================
// MAIN FUNCTION
// ======================
async function analyzeTeam(teamData, taskData) {
  const { systemPrompt, userPrompt } = buildPrompt(teamData, taskData);

  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const raw = await generateReply(systemPrompt, userPrompt);

      const parsed = parseJsonResponse(raw);

      parsed.actions = validateActions(parsed.actions);

      return parsed;
    } catch (err) {
      lastError = err;

      console.error(`AI attempt ${i + 1} failed:`, err.message);

      if (i < MAX_RETRIES - 1) {
        await sleep(Math.pow(2, i) * 500);
      }
    }
  }

  throw new Error("AI analyze failed: " + lastError.message);
}

// ======================
module.exports = {
  analyzeTeam,
};