const taskService = require("./taskService");

const ACTION_TYPES = {
  REASSIGN_TASK: "REASSIGN_TASK",
  BLOCK_ASSIGNMENT: "BLOCK_ASSIGNMENT",
  DELAY_TASK: "DELAY_TASK",
  PRIORITIZE_TASK: "PRIORITIZE_TASK",
  // NEW: Statistics & deep interventions
  STATS_TEAM_PROGRESS: "STATS_TEAM_PROGRESS",
  ALERT_STUCK_USER: "ALERT_STUCK_USER",
  AUTO_ASSIGN_BALANCE: "AUTO_ASSIGN_BALANCE",
  NOTIFY_MEMBER: "NOTIFY_MEMBER",
  FLAG_RISK: "FLAG_RISK",
};

const actionValidators = {
  [ACTION_TYPES.REASSIGN_TASK]: async (params, context) => {
    if (!params.taskId) return { valid: false, error: "taskId 是必填的" };
    if (!params.to_user && !params.newAssigneeId) {
      return { valid: false, error: "新 assigneeId 是必填的" };
    }
    const task = await taskService.getById(params.taskId);
    if (!task) return { valid: false, error: "Task 不存在" };
    return { valid: true, task };
  },

  [ACTION_TYPES.BLOCK_ASSIGNMENT]: async (params) => {
    if (!params.taskId) return { valid: false, error: "taskId 是必填的" };
    if (!params.reason) return { valid: false, error: "block reason 是必填的" };
    const task = await taskService.getById(params.taskId);
    if (!task) return { valid: false, error: "Task 不存在" };
    return { valid: true, task };
  },

  [ACTION_TYPES.DELAY_TASK]: async (params) => {
    if (!params.taskId) return { valid: false, error: "taskId 是必填的" };
    if (!params.new_due_date && !params.newDueDate) {
      return { valid: false, error: "newDueDate 是必填的" };
    }
    const task = await taskService.getById(params.taskId);
    if (!task) return { valid: false, error: "Task 不存在" };
    return { valid: true, task };
  },

  [ACTION_TYPES.PRIORITIZE_TASK]: async (params) => {
    if (!params.taskId) return { valid: false, error: "taskId 是必填的" };
    if (!["low", "medium", "high"].includes(params.priority)) {
      return { valid: false, error: "priority 必须是 low/medium/high" };
    }
    const task = await taskService.getById(params.taskId);
    if (!task) return { valid: false, error: "Task 不存在" };
    return { valid: true, task };
  },

  // NEW: Stats action - no validation needed (report only)
  [ACTION_TYPES.STATS_TEAM_PROGRESS]: async (params, context) => {
    return { valid: true };
  },

  // NEW: Alert stuck user - check if user exists
  [ACTION_TYPES.ALERT_STUCK_USER]: async (params) => {
    if (!params.userId) return { valid: false, error: "userId 是必填的" };
    return { valid: true };
  },

  // NEW: Auto assign balance - check if there are tasks to reassign
  [ACTION_TYPES.AUTO_ASSIGN_BALANCE]: async (params) => {
    if (!params.fromUserId && !params.toUserId) {
      return { valid: false, error: "fromUserId hoặc toUserId là bắt buộc" };
    }
    return { valid: true };
  },

  // NEW: Notify member
  [ACTION_TYPES.NOTIFY_MEMBER]: async (params) => {
    if (!params.userId) return { valid: false, error: "userId 是必填的" };
    if (!params.message) return { valid: false, error: "message 是必填的" };
    return { valid: true };
  },

  // NEW: Flag risk on task
  [ACTION_TYPES.FLAG_RISK]: async (params) => {
    if (!params.taskId) return { valid: false, error: "taskId 是必填的" };
    if (!params.riskNote) return { valid: false, error: "riskNote 是必填的" };
    const task = await taskService.getById(params.taskId);
    if (!task) return { valid: false, error: "Task 不存在" };
    return { valid: true, task };
  },
};

async function executeAction(action, context = {}) {
  const actionType = action.type || action.actionType;
  const params = action;

  const validator = actionValidators[actionType];
  if (!validator) {
    return {
      success: false,
      error: `未知的动作类型: ${actionType}`,
      code: "UNKNOWN_ACTION",
    };
  }

  const validation = await validator(params, context);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      code: "VALIDATION_FAILED",
    };
  }

  const { task } = validation;
  const actorId = context.actorId || context.requestedBy;

  try {
    switch (actionType) {
      case ACTION_TYPES.REASSIGN_TASK: {
        const newAssigneeId = params.to_user || params.newAssigneeId;
        await taskService.reassignTask(params.task_id || params.taskId, newAssigneeId, null, actorId);
        break;
      }

      case ACTION_TYPES.BLOCK_ASSIGNMENT: {
        const currentNotes = task.risksNotes || "";
        const blockNote = `[BLOCKED] ${params.reason}`;
        const newNotes = currentNotes ? `${blockNote}\n${currentNotes}` : blockNote;
        await taskService.updateTask(params.task_id || params.taskId, { risksNotes: newNotes }, actorId);
        break;
      }

      case ACTION_TYPES.DELAY_TASK: {
        const newDate = params.new_due_date || params.newDueDate;
        await taskService.updateTask(params.task_id || params.taskId, { dueDate: newDate }, actorId);
        break;
      }

      case ACTION_TYPES.PRIORITIZE_TASK: {
        await taskService.updateTask(params.task_id || params.taskId, { priority: params.priority }, actorId);
        break;
      }

      // NEW: Stats team progress (report only - no mutation needed, handled specially)
      case ACTION_TYPES.STATS_TEAM_PROGRESS: {
        // No action needed - stats already returned in response
        break;
      }

      // NEW: Alert stuck user (create notification)
      case ACTION_TYPES.ALERT_STUCK_USER: {
        const notificationService = require("./notificationService");
        await notificationService.create({
          userId: params.userId,
          type: "ai_alert_stuck",
          title: "⚠️ AI Cảnh báo: Task bị \"bí\"",
          message: params.message || "Bạn có thể đang bí với task. Hãy yêu cầu hỗ trợ từ team.",
          link: "/tasks",
          meta: {
            alertType: "stuck_user",
            tasks: params.tasks || [],
            severity: params.severity || "medium",
            suggestedActions: params.suggestedActions || [],
          },
        });
        break;
      }

      // NEW: Auto assign balance
      case ACTION_TYPES.AUTO_ASSIGN_BALANCE: {
        const fromUserId = params.fromUserId;
        const toUserId = params.toUserId;
        const tasksToReassign = params.taskIds || [];

        if (tasksToReassign.length > 0) {
          for (const taskId of tasksToReassign) {
            await taskService.reassignTask(taskId, toUserId, null, actorId);
          }
        }
        break;
      }

      // NEW: Notify member
      case ACTION_TYPES.NOTIFY_MEMBER: {
        const notificationService = require("./notificationService");
        await notificationService.create({
          userId: params.userId,
          type: "ai_notification",
          title: params.title || "📢 AI Thông báo",
          message: params.message,
          link: params.link || "/tasks",
          meta: {
            source: "ai_assistant",
            priority: params.priority || "normal",
          },
        });
        break;
      }

      // NEW: Flag risk on task
      case ACTION_TYPES.FLAG_RISK: {
        const currentNotes = task.risksNotes || "";
        const flagNote = `[RISK FLAGGED] ${params.riskNote}`;
        const newNotes = currentNotes ? `${flagNote}\n${currentNotes}` : flagNote;
        await taskService.updateTask(params.task_id || params.taskId, { risksNotes: newNotes }, actorId);
        break;
      }

      default:
        return { success: false, error: "未处理的动作类型", code: "UNHANDLED_ACTION" };
    }

    const updatedTask = await taskService.getById(params.task_id || params.taskId);
    return {
      success: true,
      task: updatedTask,
      actionTaken: actionType,
      reason: params.reason || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: "EXECUTION_FAILED",
    };
  }
}

async function executeActions(actions, context = {}) {
  const results = [];

  for (const action of actions) {
    const result = await executeAction(action, context);
    results.push({
      actionType: action.type || action.actionType,
      params: action,
      result,
    });
  }

  return results;
}

module.exports = {
  executeAction,
  executeActions,
  ACTION_TYPES,
};
