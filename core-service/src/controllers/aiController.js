const taskService = require("../services/taskService");
const chatGroupService = require("../services/chatGroupService");
const userService = require("../services/userService");
const { executeActions, ACTION_TYPES } = require("../services/aiActionService");

async function analyze(req, res, next) {
  try {
    const { teamId, userCommand } = req.body || {};
    const actorId = req.user?.id;

    console.log(`[AI Analyze] Starting for teamId: ${teamId}, actorId: ${actorId}, command: ${userCommand}`);

    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let teamData = { id: teamId || "personal", members: [] };
    let taskData = [];
    let teamStats = {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      doneTasks: 0,
      highPriorityTasks: 0,
      overdueTasks: 0,
      members: [],
      isLeader: false,
      groupSize: 0,
      groupName: null,
    };

    try {
      // Fetch user's groups and tasks
      const [tasks, groups] = await Promise.all([
        taskService.getAll(actorId),
        chatGroupService.getMyGroups(actorId),
      ]);

      console.log(`[AI Analyze] Found ${tasks?.length || 0} tasks, ${groups?.length || 0} groups`);

      // Determine if analyzing a specific team or personal
      if (teamId) {
        // Find the group
        const group = groups?.find(g => g.id === teamId || g._id === teamId);

        if (!group) {
          return res.status(403).json({
            message: "Bạn không có quyền truy cập nhóm này",
            code: "GROUP_ACCESS_DENIED"
          });
        }

        const memberCount = group.members?.length || 0;
        teamStats.groupSize = memberCount;
        teamStats.groupName = group.name;

        // Check if user is leader
        const userMember = group.members?.find(m => m.userId === actorId || m.userId === String(actorId));
        const isLeader = userMember && userMember.role === "leader";
        teamStats.isLeader = isLeader;

        console.log(`[AI Analyze] Group: ${group.name}, members: ${memberCount}, userRole: ${userMember?.role}, isLeader: ${isLeader}`);

        // Permission logic:
        // - If group size > 2: only leader can analyze full team
        // - If group size <= 2: both members can analyze each other
        if (memberCount > 2 && !isLeader) {
          return res.status(403).json({
            message: "Chỉ Leader (Owner/Admin) mới được phân tích team khi nhóm có >2 người",
            code: "PERMISSION_DENIED"
          });
        }

        // Get all members in the group
        const memberIds = new Set();
        group.members?.forEach(m => memberIds.add(m.userId));

        // Fetch all tasks for group members
        const allTasks = [];
        for (const memberId of memberIds) {
          const memberTasks = await taskService.getAll(memberId).catch(() => []);
          allTasks.push(...memberTasks);
        }
        // Remove duplicates by task ID
        const uniqueTasks = Array.from(
          new Map(allTasks.map(t => [t.id || t._id, t])).values()
        );
        taskData = uniqueTasks.filter(t => t.status !== "done" && t.status !== "cancelled");

        // Build team data with all members
        const memberPromises = Array.from(memberIds).map(id =>
          userService.getUserById(id).catch(() => null)
        );
        const members = (await Promise.all(memberPromises)).filter(Boolean);

        const memberMap = {};
        members.forEach(m => {
          const key = m.id || m._id;
          const memberRole = group.members?.find(mm => mm.userId === key || mm.userId === String(key))?.role || "member";
          memberMap[key] = {
            id: key,
            name: m.username || m.name || m.email || "Unknown",
            role: memberRole,
            taskCount: 0,
            pendingCount: 0,
            inProgressCount: 0,
            overdueCount: 0,
            tasks: [],
          };
        });

        // Count tasks per member
        const today = new Date().toISOString().split("T")[0];
        taskData.forEach(t => {
          if (t.assigneeId && memberMap[t.assigneeId]) {
            memberMap[t.assigneeId].taskCount++;
            memberMap[t.assigneeId].pendingCount += t.status === "pending" ? 1 : 0;
            memberMap[t.assigneeId].inProgressCount += t.status === "in_progress" ? 1 : 0;
            if (t.dueDate && t.dueDate < today) {
              memberMap[t.assigneeId].overdueCount++;
            }
            memberMap[t.assigneeId].tasks.push({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate,
              isOverdue: t.dueDate && t.dueDate < today,
            });
          }
        });

        teamData = {
          id: group.id,
          name: group.name,
          members: Object.values(memberMap),
        };

        teamStats.members = Object.values(memberMap);

      } else {
        // Personal analysis - only user's own tasks
        taskData = tasks.filter(t => t.status !== "done" && t.status !== "cancelled");
        teamStats.members = [{
          id: actorId,
          name: "You",
          role: "leader", // Personal mode: user is the leader of their own tasks
          taskCount: taskData.length,
          pendingCount: taskData.filter(t => t.status === "pending").length,
          inProgressCount: taskData.filter(t => t.status === "in_progress").length,
          overdueCount: taskData.filter(t => t.dueDate && t.dueDate < new Date().toISOString().split("T")[0]).length,
        }];
        teamData.members = teamStats.members;
      }

      // Calculate overall stats (already calculated per-member, now aggregate)
      teamStats.totalTasks = taskData.length;
      teamStats.pendingTasks = taskData.filter(t => t.status === "pending").length;
      teamStats.inProgressTasks = taskData.filter(t => t.status === "in_progress").length;
      teamStats.doneTasks = taskData.filter(t => t.status === "done").length;
      teamStats.highPriorityTasks = taskData.filter(t => t.priority === "high" && t.status !== "done").length;

      const today = new Date().toISOString().split("T")[0];
      teamStats.overdueTasks = taskData.filter(t => t.dueDate && t.dueDate < today && t.status !== "done" && t.status !== "cancelled").length;

    } catch (err) {
      console.error("Failed to gather team data:", err.message);
    }

    if (taskData.length === 0) {
      return res.json({
        actions: [],
        executed: [],
        rejected: [],
        message: "Không có task nào để phân tích",
        stats: teamStats,
      });
    }

    // Build AI prompt with permission context
    const systemPrompt = `
Bạn là AI advisor CHO HÀNG ĐẦU cho hệ thống quản lý task.
Bạn có khả năng PHÂN TÍCH SÂU và ĐỀ XUẤT HÀNH ĐỘNG CỤ THỂ.

=====================
QUYỀN HẠN PHÂN TÍCH
=====================

- Nhóm > 2 người: CHỈ Leader được phân tích TOÀN BỘ team
- Nhóm 2 người: CẢ 2 người đều được phân tích
- Personal mode: Chỉ phân tích task cá nhân

=====================
NHIỆN VỤ CHÍNH
=====================

Nếu user yêu cầu:
- "thống kê tiến độ" → dùng action STATS_TEAM_PROGRESS
- "ai bị bí task" / "ai khó khăn" → dùng action ALERT_STUCK_USER
- "cân bằng task" / "chia đều" → dùng action AUTO_ASSIGN_BALANCE
- Phát hiện vấn đề bất thường → dùng action FLAG_RISK, NOTIFY_MEMBER
- Giao/chuyển task → dùng REASSIGN_TASK
- Ưu tiên task → dùng PRIORITIZE_TASK
- Delay deadline → dùng DELAY_TASK
- Block task bất thường → dùng BLOCK_ASSIGNMENT

=====================
QUY TẮC BẮT BUỘC
=====================

- LUÔN trả về ÍT NHẤT 1 action liên quan đến yêu cầu của user
- KHÔNG được trả text ngoài JSON
- KHÔNG giải thích ngoài field "reason"
- Cố gắng PHÁT HIỆN các vấn đề ẩn trong dữ liệu
- Nếu user không phải leader và nhóm >2: KHÔNG đề xuất thay đổi task của người khác (chỉ có thể thông báo/alert)

=====================
LOGIC PHÂN TÍCH SÂU
=====================

**PHÁT HIỆN USER BỊ BÍ (ALERT_STUCK_USER):**
- User có task "in_progress" quá lâu (> 3 ngày) mà không hoàn thành
- User có task overdue mà không chuyển trạng thái
- User có task high priority nhưng toàn quá hạn
- Có thể gửi thông báo cho user đó

**CÂN BẰNG TẢI (AUTO_ASSIGN_BALANCE):**
- Chỉ áp dụng nếu user là LEADER
- Tính số task mỗi người trong team
- Ai có > 5 tasks pending → cân bằng sang ai có < 2 tasks
- Ưu tiên chuyển task low priority trước

**THỐNG KÊ TIẾN ĐỘ (STATS_TEAM_PROGRESS):**
- Tổng số task, theo status, theo priority
- % hoàn thành của team
- Ai đang overload, ai đang rảnh
- Các task overdue cần attention

=====================
ACTIONS ĐƯỢC PHÉP
=====================

1. STATS_TEAM_PROGRESS
{
  "type": "STATS_TEAM_PROGRESS",
  "include_members": true,
  "include_overdue": true,
  "include_priority": true,
  "reason": "Tổng hợp thống kê tiến độ team"
}

2. ALERT_STUCK_USER
{
  "type": "ALERT_STUCK_USER",
  "userId": "string (ID của user bị bí)",
  "message": "string (thông điệp cảnh báo)",
  "severity": "low|medium|high",
  "tasks": ["array of task IDs bị ảnh hưởng"],
  "suggestedActions": ["Gợi ý hành động cụ thể"],
  "reason": "Giải thích tại sao user này bị bí"
}

3. AUTO_ASSIGN_BALANCE
{
  "type": "AUTO_ASSIGN_BALANCE",
  "fromUserId": "string (user có quá nhiều task)",
  "toUserId": "string (user nhận task)",
  "taskIds": ["array of task IDs cần chuyển"],
  "reason": "Giải thích lý do cân bằng"
}

4. NOTIFY_MEMBER
{
  "type": "NOTIFY_MEMBER",
  "userId": "string",
  "title": "string",
  "message": "string",
  "priority": "normal|high|urgent",
  "link": "/tasks",
  "reason": "Tại sao cần thông báo cho user này"
}

5. FLAG_RISK
{
  "type": "FLAG_RISK",
  "taskId": "string",
  "riskNote": "string (mô tả rủi ro cụ thể)",
  "severity": "low|medium|high|critical",
  "reason": "Tại sao task này có rủi ro"
}

6. REASSIGN_TASK (chỉ leader được phép)
{
  "type": "REASSIGN_TASK",
  "taskId": "string",
  "to_user": "string (user ID mới)",
  "reason": "string"
}

7. PRIORITIZE_TASK
{
  "type": "PRIORITIZE_TASK",
  "taskId": "string",
  "priority": "high|medium|low",
  "reason": "string"
}

8. DELAY_TASK
{
  "type": "DELAY_TASK",
  "taskId": "string",
  "new_due_date": "YYYY-MM-DD",
  "reason": "string"
}

9. BLOCK_ASSIGNMENT
{
  "type": "BLOCK_ASSIGNMENT",
  "taskId": "string",
  "reason": "string"
}

=====================
FORMAT TRẢ VỀ
=====================

Luôn trả JSON:
{
  "actions": [ ... ],
  "summary": "Tóm tắt ngắn gọn phân tích (1-2 câu)"
}
`;

    const userPrompt = `Team Stats:
${JSON.stringify(teamStats, null, 2)}

Tasks cần xem xét:
${JSON.stringify(taskData, null, 2)}

Yêu cầu từ user: "${userCommand || 'phân tích chung'}"

Hãy phân tích và trả về JSON actions phù hợp. Nếu user yêu cầu thống kê → dùng STATS_TEAM_PROGRESS.
Nếu phát hiện user bị bí task → dùng ALERT_STUCK_USER.
Nếu thấy phân bổ task không cân bằng → dùng AUTO_ASSIGN_BALANCE.
Nếu phát hiện rủi ro → dùng FLAG_RISK.

Nếu không cần thay đổi gì, trả về {"actions": [], "summary": "..."}`;

    console.log(`[AI Analyze] Sending to AI - team: ${teamData.id}, ${teamData.members?.length || 0} members, ${taskData.length} tasks`);
    console.log(`[AI Analyze] Task data:`, JSON.stringify(taskData, null, 2).substring(0, 500));

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    let aiResponse;

    if (anthropicApiKey) {
      const { analyzeWithClaude } = require("../services/aiAnalyzeService");
      try {
        aiResponse = await analyzeWithClaude(systemPrompt, userPrompt);
      } catch (claudeErr) {
        console.error("Claude analyze failed:", claudeErr.message);
        const isAuthError = claudeErr.response?.status === 401 || claudeErr.response?.status === 403 || claudeErr.message?.includes("401") || claudeErr.message?.includes("403");
        if (isAuthError) {
          console.log("Claude API auth failed (401/403), trying OpenAI fallback...");
          if (openaiApiKey) {
            const { analyzeWithOpenAI } = require("../services/aiAnalyzeService");
            aiResponse = await analyzeWithOpenAI(systemPrompt, userPrompt, openaiApiKey);
          } else {
            return res.status(503).json({
              message: "API key Claude không hợp lệ. Vui lòng thêm OPENAI_API_KEY vào file .env của core-service để sử dụng AI.",
              code: "INVALID_API_KEY",
            });
          }
        } else {
          return res.json({
            actions: [],
            executed: [],
            rejected: [],
            message: "AI analyze không khả dụng: " + claudeErr.message,
          });
        }
      }
    } else if (openaiApiKey) {
      const { analyzeWithOpenAI } = require("../services/aiAnalyzeService");
      aiResponse = await analyzeWithOpenAI(systemPrompt, userPrompt, openaiApiKey);
    } else {
      return res.json({
        actions: [],
        executed: [],
        rejected: [],
        message: "Không có API key AI được cấu hình. Vui lòng thêm ANTHROPIC_API_KEY hoặc OPENAI_API_KEY trong file .env của core-service.",
      });
    }

    let parsedActions;
    try {
      // Strip markdown code blocks first
      let cleanResponse = aiResponse
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedActions = JSON.parse(jsonMatch[0]);
        console.log(`[AI Analyze] Raw response: ${aiResponse.substring(0, 200)}`);
      } else {
        console.log(`[AI Analyze] No JSON found in response: ${aiResponse}`);
        parsedActions = { actions: [] };
      }
    } catch (e) {
      console.log(`[AI Analyze] JSON parse error: ${e.message}, raw: ${aiResponse}`);
      parsedActions = { actions: [] };
    }

    console.log(`[AI Analyze] Parsed actions: ${JSON.stringify(parsedActions)}`);

    const validTypes = Object.values(ACTION_TYPES);
    const filteredActions = (parsedActions.actions || []).filter(
      (a) => a.type && validTypes.includes(a.type)
    );

    console.log(`[AI Analyze] Filtered actions: ${filteredActions.length}`);

    // Filter out STATS_TEAM_PROGRESS - it's just a report, no execution needed
    const actionsToExecute = filteredActions.filter(a => a.type !== ACTION_TYPES.STATS_TEAM_PROGRESS);

    const context = { actorId, requestedBy: actorId };
    const executionResults = await executeActions(actionsToExecute, context);

    const executed = executionResults
      .filter((r) => r.result?.success)
      .map((r) => ({
        ...r.params,
        type: r.actionType,
        executedAt: new Date().toISOString(),
      }));

    const rejected = executionResults
      .filter((r) => !r.result?.success)
      .map((r) => ({
        action: r.params,
        reason: r.result?.error || "Unknown error",
      }));

    res.json({
      actions: filteredActions,
      executed,
      rejectedActions: rejected,
      stats: teamStats,
      summary: parsedActions.summary || "Phân tích AI hoàn tất",
    });
  } catch (err) {
    console.error("AI analyze error:", err);
    next(err);
  }
}

async function executeAiActions(req, res, next) {
  try {
    const { actions, context } = req.body || {};

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({
        message: "actions 必须是数组",
        code: "INVALID_PARAMS",
      });
    }

    const execContext = {
      ...context,
      actorId: req.user?.id || context?.requestedBy || "system",
    };

    const results = await executeActions(actions, execContext);

    const executed = results.filter((r) => r.result.success);
    const rejected = results.filter((r) => !r.result.success);

    res.json({
      success: true,
      summary: {
        total: results.length,
        executed: executed.length,
        rejected: rejected.length,
      },
      results,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  analyze,
  executeAiActions,
};
