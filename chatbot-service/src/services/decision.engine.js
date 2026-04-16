const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://localhost:5001";

const ACTION_TYPES = {
  REASSIGN_TASK: "REASSIGN_TASK",
  BLOCK_ASSIGNMENT: "BLOCK_ASSIGNMENT",
  DELAY_TASK: "DELAY_TASK",
  PRIORITIZE_TASK: "PRIORITIZE_TASK",
};

const MAX_WORKLOAD_PERCENT = 80;

async function fetchTask(taskId) {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/api/tasks/${taskId}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchUser(userId) {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/api/users/${userId}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchUserTasks(userId) {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/api/tasks?assigneeId=${userId}`);
    if (!response.ok) return [];
    const tasks = await response.json();
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function calculateWorkload(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in_progress" || t.status === "pending"
  );
  return inProgressTasks.length;
}

async function validateReassignTask(action) {
  const taskId = action.task_id || action.taskId;
  const toUserId = action.to_user || action.newAssigneeId;
  const requiredSkill = action.required_skill || action.requiredSkill;

  if (!taskId) {
    return { valid: false, reason: "task_id 是必填的" };
  }

  if (!toUserId) {
    return { valid: false, reason: "to_user 是必填的" };
  }

  const task = await fetchTask(taskId);
  if (!task) {
    return { valid: false, reason: "Task 不存在" };
  }

  const targetUser = await fetchUser(toUserId);
  if (!targetUser) {
    return { valid: false, reason: "目标用户不存在" };
  }

  if (requiredSkill) {
    const userSkills = targetUser.skills || [];
    if (!userSkills.includes(requiredSkill)) {
      return {
        valid: false,
        reason: `用户缺少所需技能: ${requiredSkill}`,
      };
    }
  }

  const userTasks = await fetchUserTasks(toUserId);
  const currentWorkload = calculateWorkload(userTasks);

  if (currentWorkload >= MAX_WORKLOAD_PERCENT) {
    return {
      valid: false,
      reason: `用户当前 workload 已达 ${currentWorkload}，超过 ${MAX_WORKLOAD_PERCENT}% 上限`,
    };
  }

  return { valid: true };
}

async function validateBlockAssignment(action) {
  const taskId = action.task_id || action.taskId;
  const userId = action.user_id || action.userId || action.assigneeId;

  if (!userId) {
    return { valid: false, reason: "user_id 是必填的" };
  }

  const user = await fetchUser(userId);
  if (!user) {
    return { valid: false, reason: "用户不存在" };
  }

  if (taskId) {
    const task = await fetchTask(taskId);
    if (!task) {
      return { valid: false, reason: "Task 不存在" };
    }
  }

  return { valid: true };
}

async function validateDelayTask(action) {
  const taskId = action.task_id || action.taskId;

  if (!taskId) {
    return { valid: false, reason: "task_id 是必填的" };
  }

  const task = await fetchTask(taskId);
  if (!task) {
    return { valid: false, reason: "Task 不存在" };
  }

  if (task.status === "done") {
    return { valid: false, reason: "已完成的 task 不能延迟" };
  }

  if (task.status === "cancelled") {
    return { valid: false, reason: "已取消的 task 不能延迟" };
  }

  return { valid: true };
}

async function validatePrioritizeTask(action) {
  const taskId = action.task_id || action.taskId;
  const priority = action.priority;

  if (!taskId) {
    return { valid: false, reason: "task_id 是必填的" };
  }

  const task = await fetchTask(taskId);
  if (!task) {
    return { valid: false, reason: "Task 不存在" };
  }

  if (priority && !["low", "medium", "high"].includes(priority)) {
    return { valid: false, reason: "priority 必须是 low/medium/high" };
  }

  return { valid: true };
}

async function validateAction(action) {
  const actionType = action.type || action.actionType;

  switch (actionType) {
    case ACTION_TYPES.REASSIGN_TASK:
      return validateReassignTask(action);
    case ACTION_TYPES.BLOCK_ASSIGNMENT:
      return validateBlockAssignment(action);
    case ACTION_TYPES.DELAY_TASK:
      return validateDelayTask(action);
    case ACTION_TYPES.PRIORITIZE_TASK:
      return validatePrioritizeTask(action);
    default:
      return { valid: false, reason: `未知的动作类型: ${actionType}` };
  }
}

async function validateActions(actions) {
  if (!Array.isArray(actions)) {
    throw new Error("actions 必须是数组");
  }

  const validActions = [];
  const rejectedActions = [];

  for (const action of actions) {
    const validation = await validateAction(action);

    if (validation.valid) {
      validActions.push(action);
    } else {
      rejectedActions.push({
        action,
        reason: validation.reason,
      });
    }
  }

  return {
    validActions,
    rejectedActions,
    summary: {
      total: actions.length,
      valid: validActions.length,
      rejected: rejectedActions.length,
    },
  };
}

module.exports = {
  validateActions,
  validateAction,
  ACTION_TYPES,
  MAX_WORKLOAD_PERCENT,
};
