import React, { useState, useMemo } from "react";
import { Sparkles, Loader2, XCircle, Users, User, Check, Search, ChevronRight, Clock, AlertCircle, CheckCircle2, Circle, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Helper function parse date dd/mm/yyyy
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00Z");
  }
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }
  return null;
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  const dueDate = parseDate(dueDateStr);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Chờ", icon: Circle },
    in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang làm", icon: Clock },
    done: { bg: "bg-green-100", text: "text-green-700", label: "Hoàn thành", icon: CheckCircle2 },
    cancelled: { bg: "bg-gray-100", text: "text-gray-600", label: "Đã hủy", icon: X },
  };
  const { bg, text, label, icon: Icon } = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }) => {
  const config = {
    high: { bg: "bg-red-100", text: "text-red-700", label: "Cao" },
    medium: { bg: "bg-amber-100", text: "text-amber-700", label: "TB" },
    low: { bg: "bg-gray-100", text: "text-gray-600", label: "Thấp" },
  };
  const { bg, text, label } = config[priority] || config.medium;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Task detail card for mobile
const TaskDetailCard = ({ task, currentUserId }) => {
  const overdue = isOverdue(task.dueDate) && task.status !== "done" && task.status !== "cancelled";
  
  // Xác định ai là người nhận/người giao
  const isTaskAssignedToMe = task.assigneeId === currentUserId || task.assignee === currentUserId;
  const taskOwner = isTaskAssignedToMe 
    ? (task.assignerName ? `👤 ${task.assignerName}` : "Bạn giao cho người khác")
    : (task.assigneeName ? `→ ${task.assigneeName}` : "Bạn nhận được");
  
  return (
    <div className={`bg-white rounded-xl p-3 border ${overdue ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                <Clock className="w-3 h-3" />
                {task.dueDate}
                {overdue && <AlertCircle className="w-3 h-3" />}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {taskOwner}
          </p>
        </div>
      </div>
    </div>
  );
};

// Person/Group detail view (mobile responsive)
const PersonDetailView = ({ person, tasks, onBack, currentUserId }) => {
  const personTasks = useMemo(() => {
    return tasks.filter(t => {
      // Group task
      if (person.type === "group") {
        return t.source === "group" && t.sourceId === person.id;
      }
      // Friend task - lọc theo nhiều cách
      // 1. Task mà người này là người nhận
      const isAssignee = t.assigneeId === person.id || t.assignee === person.id;
      // 2. Task mà người này là người giao (họ giao cho mình)
      const isAssigner = t.assignerId === person.id || t.assigner === person.id;
      return isAssignee || isAssigner;
    });
  }, [tasks, person]);

  const pending = personTasks.filter(t => t.status === "pending");
  const inProgress = personTasks.filter(t => t.status === "in_progress");
  const done = personTasks.filter(t => t.status === "done");
  const overdue = personTasks.filter(t => isOverdue(t.dueDate) && t.status !== "done" && t.status !== "cancelled");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-200 transition md:hidden"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
        </button>
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
          person.type === "group" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
        }`}>
          {person.type === "group" ? <Users className="w-5 h-5" /> : person.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
          <p className="text-xs text-gray-500">
            {person.type === "group" ? "Nhóm chat" : "Cá nhân"} · {personTasks.length} task
          </p>
        </div>
        <button
          onClick={onBack}
          className="p-2 -mr-2 rounded-lg hover:bg-gray-200 transition hidden md:block"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{personTasks.length}</p>
          <p className="text-xs text-gray-500">Tổng</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500">Chờ</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{inProgress.length}</p>
          <p className="text-xs text-gray-500">Đang</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold ${overdue.length > 0 ? "text-red-600" : "text-gray-400"}`}>
            {overdue.length}
          </p>
          <p className="text-xs text-gray-500">Quá hạn</p>
        </div>
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Overdue tasks first */}
        {overdue.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-600 uppercase mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Quá hạn ({overdue.length})
            </h4>
            <div className="space-y-2">
              {overdue.map(task => (
                <TaskDetailCard key={task._id || task.id} task={task} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-blue-600 uppercase mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Đang làm ({inProgress.length})
            </h4>
            <div className="space-y-2">
              {inProgress.map(task => (
                <TaskDetailCard key={task._id || task.id} task={task} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1">
              <Circle className="w-3.5 h-3.5" />
              Chờ làm ({pending.length})
            </h4>
            <div className="space-y-2">
              {pending.map(task => (
                <TaskDetailCard key={task._id || task.id} task={task} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        )}

        {/* Done */}
        {done.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Hoàn thành ({done.length})
            </h4>
            <div className="space-y-2">
              {done.map(task => (
                <TaskDetailCard key={task._id || task.id} task={task} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        )}

        {personTasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Không có task nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AiAnalyzeModal({ teamId, onClose, tasks = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [userCommand, setUserCommand] = useState("");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  // Get current user ID
  const currentUserId = useMemo(() => {
    const userStr = localStorage.getItem("chatwave_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || user._id;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  // Build list of people/groups from tasks
  const peopleList = useMemo(() => {
    const map = new Map();

    tasks.forEach((task) => {
      // Task từ nhóm
      if (task.source === "group" && task.sourceId) {
        const key = `group:${task.sourceId}`;
        if (!map.has(key)) {
          map.set(key, {
            id: task.sourceId,
            name: task.sourceName || "Nhóm chat",
            type: "group",
            taskCount: 0,
          });
        }
        map.get(key).taskCount++;
      }
      // Task 1-1: người nhận
      else if (task.assigneeId) {
        const key = `assignee:${task.assigneeId}`;
        if (!map.has(key)) {
          map.set(key, {
            id: task.assigneeId,
            name: task.assigneeName || task.assignee || "Người nhận",
            type: "friend",
            taskCount: 0,
          });
        }
        map.get(key).taskCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.taskCount - a.taskCount);
  }, [tasks]);

  // Filter people based on search
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return peopleList;
    const query = searchQuery.toLowerCase();
    return peopleList.filter(p => p.name.toLowerCase().includes(query));
  }, [peopleList, searchQuery]);

  const handleAnalyze = async (command = "") => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("chatwave_token");
      
      if (!token) {
        throw new Error("Vui lòng đăng nhập lại để tiếp tục");
      }
      
      const body = {
        userCommand: command || userCommand,
      };
      
      if (selectedPerson && !showDetail) {
        body.analyzeForId = selectedPerson.id;
        body.analyzeForType = selectedPerson.type;
      }

      const response = await fetch(`${API_URL}/api/v1/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Lỗi ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPerson = (person) => {
    if (selectedPerson?.id === person.id && selectedPerson?.type === person.type) {
      // Toggle to detail view
      setShowDetail(true);
    } else {
      setSelectedPerson(person);
      setShowDetail(true);
    }
  };

  const handleBackFromDetail = () => {
    setShowDetail(false);
  };

  // Show person detail view (mobile responsive)
  if (showDetail && selectedPerson) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4">
        <div className="bg-white w-full h-full md:h-auto md:rounded-2xl md:shadow-2xl md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden">
          <PersonDetailView
            person={selectedPerson} 
            tasks={tasks} 
            onBack={handleBackFromDetail}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-4 md:p-6 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#FA8DAE]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Kết quả phân tích AI
            </h2>
            {selectedPerson && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                · Task bạn giao cho {selectedPerson.name}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {/* Stats Section */}
            {result.stats && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">📊 Thống kê</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <p className="text-xl md:text-2xl font-bold text-blue-700">{result.stats.totalTasks}</p>
                    <p className="text-xs text-gray-600">Tổng task</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xl md:text-2xl font-bold text-amber-700">{result.stats.pendingTasks}</p>
                    <p className="text-xs text-gray-600">Chờ làm</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <p className="text-xl md:text-2xl font-bold text-green-700">{result.stats.inProgressTasks}</p>
                    <p className="text-xs text-gray-600">Đang làm</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                    <p className="text-xl md:text-2xl font-bold text-red-700">{result.stats.overdueTasks}</p>
                    <p className="text-xs text-gray-600">Quá hạn</p>
                  </div>
                </div>

                {result.stats.members && result.stats.members.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">👥 Thành viên</h4>
                    <div className="space-y-2">
                      {result.stats.members.map((m) => (
                        <div key={m.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-800">{m.name}</span>
                            {m.overdueCount > 0 && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                {m.overdueCount} quá hạn
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-600">
                            <span>📋 {m.taskCount} task</span>
                            <span>⏳ {m.pendingCount} chờ</span>
                            <span>🔄 {m.inProgressCount} đang</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions Section */}
            {result.actions && result.actions.filter(a => a.type !== "STATS_TEAM_PROGRESS").length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">🎯 Đề xuất của AI</h3>
                <div className="space-y-2">
                  {result.actions
                    .filter(a => a.type !== "STATS_TEAM_PROGRESS")
                    .map((action, idx) => (
                    <div key={idx} className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{action.type}</span>
                        {action.priority && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.priority === "high" ? "bg-red-100 text-red-700" :
                            action.priority === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.priority}
                          </span>
                        )}
                        {action.severity && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            action.severity === "critical" || action.severity === "high" ? "bg-red-100 text-red-700" :
                            action.severity === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {action.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{action.reason}</p>
                      {action.taskId && (
                        <p className="text-xs text-gray-500 mt-1">Task ID: {action.taskId}</p>
                      )}
                      {action.message && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{action.message}"</p>
                      )}
                      {action.userId && (
                        <p className="text-xs text-gray-500">User: {action.userId}</p>
                      )}
                    </div>
                  ))}
                </div>
                {result.summary && (
                  <p className="text-sm text-gray-600 mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    💡 {result.summary}
                  </p>
                )}
              </div>
            )}

            {result.actions && result.actions.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-gray-500">✅ Không có đề xuất nào!</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                setResult(null);
                setSelectedPerson(null);
              }}
              className="px-4 py-2 bg-[#FA8DAE] text-white rounded-xl text-sm font-medium hover:bg-[#e87a9c] transition"
            >
              Phân tích mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-auto md:rounded-2xl md:shadow-2xl md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200">
          <Sparkles className="w-5 h-5 text-[#FA8DAE]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Phân tích Task bằng AI
          </h2>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Chọn người để phân tích task */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Chọn người để xem chi tiết task:
            </label>
            
            {/* Nút "Phân tích tất cả" */}
            <button
              type="button"
              onClick={() => {
                setSelectedPerson(null);
                setShowDetail(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition mb-3 ${
                !selectedPerson
                  ? "bg-[#FA8DAE] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Phân tích tất cả ({tasks.length} task)
            </button>

            {/* Thanh tìm kiếm */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm người..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
              />
            </div>

            {/* Danh sách người */}
            {filteredPeople.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelectPerson(person)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left transition ${
                      selectedPerson?.id === person.id && selectedPerson?.type === person.type
                        ? "bg-[#FFF7F0] border-l-2 border-[#FA8DAE]"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    } ${filteredPeople.indexOf(person) !== filteredPeople.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
                        person.type === "group"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {person.type === "group" ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        person.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {person.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {person.type === "group" ? "Nhóm chat" : "Cá nhân"} · {person.taskCount} task
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-6 text-sm text-gray-500">
                Không tìm thấy "{searchQuery}"
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-500">
                Chưa có ai để phân tích
              </div>
            )}
          </div>

          {/* Command Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Yêu cầu phân tích (tuỳ chọn):
            </label>
            <input
              type="text"
              placeholder="VD: có bị bí task không, thống kê tiến độ..."
              value={userCommand}
              onChange={(e) => setUserCommand(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
            />
          </div>

          {/* Intro / Loading / Error */}
          {!loading && !error && (
            <div className="text-center py-4 flex flex-col items-center">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#FA8DAE] mb-2" />
              <p className="text-gray-600 text-sm">
                {selectedPerson
                  ? `AI sẽ phân tích ${selectedPerson.taskCount} task bạn đã giao cho ${selectedPerson.name}`
                  : "AI sẽ phân tích tất cả task bạn đã giao"}
              </p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                Có thể hỏi: "Có bị bí task không?", "Ai làm chậm?", "Cân bằng công việc"
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-[#FA8DAE] animate-spin mb-4" />
              <p className="text-gray-600">AI đang phân tích...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Lỗi</span>
              </div>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition"
          >
            Đóng
          </button>
          <button
            onClick={() => handleAnalyze(userCommand)}
            disabled={loading}
            className="px-4 py-2 bg-[#FA8DAE] text-white rounded-xl text-sm font-medium hover:bg-[#e87a9c] transition disabled:opacity-50"
          >
            {loading ? "Đang phân tích..." : "Phân tích"}
          </button>
        </div>
      </div>
    </div>
  );
}
