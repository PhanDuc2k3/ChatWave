const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://localhost:5001";

const ACTION_TYPES = {
  REASSIGN_TASK: "REASSIGN_TASK",
  BLOCK_ASSIGNMENT: "BLOCK_ASSIGNMENT",
  DELAY_TASK: "DELAY_TASK",
  PRIORITIZE_TASK: "PRIORITIZE_TASK",
};

async function executeReassignTask(action, actorId) {
  const taskId = action.task_id || action.taskId;
  const newAssigneeId = action.to_user || action.newAssigneeId;
  const newAssigneeName = action.to_user_name || action.newAssigneeName || null;

  console.log(`[executor] REASSIGN_TASK: task=${taskId} → user=${newAssigneeId}`);

  const response = await fetch(`${CORE_SERVICE_URL}/api/tasks/${taskId}/reassign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assigneeId: newAssigneeId,
      assigneeName: newAssigneeName,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`REASSIGN_TASK failed: ${response.status} - ${error}`);
  }

  const task = await response.json();
  console.log(`[executor] REASSIGN_TASK success: task=${taskId}`);

  return {
    actionType: ACTION_TYPES.REASSIGN_TASK,
    success: true,
    task,
    reason: action.reason || null,
  };
}

async function executeBlockAssignment(action, actorId) {
  const userId = action.user_id || action.userId || action.assigneeId;
  const reason = action.reason || "Blocked by AI decision engine";

  console.log(`[executor] BLOCK_ASSIGNMENT: user=${userId}`);

  const response = await fetch(`${CORE_SERVICE_URL}/api/users/${userId}/block`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`BLOCK_ASSIGNMENT failed: ${response.status} - ${error}`);
  }

  const user = await response.json();
  console.log(`[executor] BLOCK_ASSIGNMENT success: user=${userId}`);

  return {
    actionType: ACTION_TYPES.BLOCK_ASSIGNMENT,
    success: true,
    user,
    reason,
  };
}

async function executeDelayTask(action, actorId) {
  const taskId = action.task_id || action.taskId;
  const newDueDate = action.new_due_date || action.newDueDate;

  if (!newDueDate) {
    throw new Error("newDueDate 是必填的");
  }

  console.log(`[executor] DELAY_TASK: task=${taskId} → dueDate=${newDueDate}`);

  const response = await fetch(`${CORE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dueDate: newDueDate }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`DELAY_TASK failed: ${response.status} - ${error}`);
  }

  const task = await response.json();
  console.log(`[executor] DELAY_TASK success: task=${taskId}`);

  return {
    actionType: ACTION_TYPES.DELAY_TASK,
    success: true,
    task,
    reason: action.reason || null,
  };
}

async function executePrioritizeTask(action, actorId) {
  const taskId = action.task_id || action.taskId;
  const priority = action.priority;

  if (!priority || !["low", "medium", "high"].includes(priority)) {
    throw new Error("priority 必须是 low/medium/high");
  }

  console.log(`[executor] PRIORITIZE_TASK: task=${taskId} → priority=${priority}`);

  const response = await fetch(`${CORE_SERVICE_URL}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`PRIORITIZE_TASK failed: ${response.status} - ${error}`);
  }

  const task = await response.json();
  console.log(`[executor] PRIORITIZE_TASK success: task=${taskId}`);

  return {
    actionType: ACTION_TYPES.PRIORITIZE_TASK,
    success: true,
    task,
    reason: action.reason || null,
  };
}

async function executeAction(action, actorId = "system") {
  const actionType = action.type || action.actionType;

  try {
    switch (actionType) {
      case ACTION_TYPES.REASSIGN_TASK:
        return await executeReassignTask(action, actorId);

      case ACTION_TYPES.BLOCK_ASSIGNMENT:
        return await executeBlockAssignment(action, actorId);

      case ACTION_TYPES.DELAY_TASK:
        return await executeDelayTask(action, actorId);

      case ACTION_TYPES.PRIORITIZE_TASK:
        return await executePrioritizeTask(action, actorId);

      default:
        console.warn(`[executor] Unknown action type: ${actionType}`);
        return {
          actionType: actionType,
          success: false,
          error: `未知的动作类型: ${actionType}`,
        };
    }
  } catch (err) {
    console.error(`[executor] ${actionType} error:`, err.message);
    return {
      actionType: actionType,
      success: false,
      error: err.message,
    };
  }
}

async function executeActions(actions, actorId = "system") {
  if (!Array.isArray(actions)) {
    throw new Error("actions 必须是数组");
  }

  const results = [];

  for (const action of actions) {
    const result = await executeAction(action, actorId);
    results.push(result);
  }

  const executed = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`[executor] Summary: total=${actions.length}, success=${executed.length}, failed=${failed.length}`);

  return {
    executed,
    failed,
    summary: {
      total: actions.length,
      success: executed.length,
      failed: failed.length,
    },
  };
}

module.exports = {
  executeAction,
  executeActions,
  ACTION_TYPES,
};
