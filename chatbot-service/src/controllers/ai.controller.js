const aiService = require("../services/ai.service");
const { validateActions } = require("../services/decision.engine");
const { executeActions } = require("../services/action.executor");

const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://localhost:5001";

async function fetchTeamData(teamId) {
  const response = await fetch(`${CORE_SERVICE_URL}/api/users/team/${teamId}`);
  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to fetch team: ${error}`);
  }
  return response.json();
}

async function fetchTaskData(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const response = await fetch(`${CORE_SERVICE_URL}/api/tasks?${query}`);
  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Failed to fetch tasks: ${error}`);
  }
  return response.json();
}

async function analyzeTeam(req, res) {
  try {
    const { teamId, taskFilters } = req.body || {};

    if (!teamId) {
      return res.status(400).json({
        message: "teamId là bắt buộc",
        code: "MISSING_TEAM_ID",
      });
    }

    const [teamData, taskData] = await Promise.all([
      fetchTeamData(teamId),
      fetchTaskData(taskFilters || {}),
    ]);

    const aiResult = await aiService.analyzeTeam(teamData, taskData);

    const { actions = [] } = aiResult;

    const validation = await validateActions(actions);
    const { validActions, rejectedActions } = validation;

    let executed = [];
    let failed = [];

    if (validActions.length > 0) {
      const actorId = req.user?.id || "system";
      try {
        const result = await executeActions(validActions, actorId);
        executed = result.executed;
        failed = result.failed;

        failed.forEach((f) => {
          rejectedActions.push({
            action: f,
            reason: f.error || "Execution failed",
          });
        });
      } catch (err) {
        console.error("[ai] Action executor error:", err.message);
      }
    }

    res.json({
      actions,
      validation,
      validActions,
      rejectedActions,
      executed,
    });
  } catch (err) {
    console.error("[ai] analyzeTeam error:", err?.message);

    let status = 500;
    let message = "Lỗi khi phân tích team";

    if (err.message.includes("ANTHROPIC_API_KEY")) {
      status = 500;
      message = "Claude API chưa được cấu hình";
    } else if (err.message.includes("Failed to fetch")) {
      status = 502;
      message = "Không thể kết nối đến core-service";
    } else if (err.message.includes("Decision Engine")) {
      status = 500;
      message = "Decision Engine lỗi";
    }

    res.status(status).json({ message, code: "ANALYSIS_FAILED" });
  }
}

module.exports = { analyzeTeam };
