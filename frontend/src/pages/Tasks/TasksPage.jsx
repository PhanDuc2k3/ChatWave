import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  Users,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Sparkles,
  UserCheck,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { useTasks } from "../../hooks/useTasks";
import TaskDetail from "./TaskDetail";
import AiAnalyzeModal from "./AiAnalyzeModal";

const STATUS_LABELS = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Đã xong",
  cancelled: "Đã hủy",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-300",
};

const STATUS_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
  cancelled: XCircle,
};

const PRIORITY_STYLES = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-gray-500",
};

function TaskCard({ task, onClick, isSelected }) {
  const StatusIcon = STATUS_ICONS[task.status];
  const isGroup = task.source === "group";
  const identityName = isGroup
    ? task.sourceName || "Nhóm chat"
    : task.assignee || "Người nhận";
  const identityInitial = identityName.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className={`w-full text-left rounded-xl border p-3 transition ${
        isSelected
          ? "bg-[#FFF7F0] border-[#FA8DAE] shadow-sm"
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#FA8DAE]/20 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-[#FA8DAE]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                isGroup
                  ? "bg-[#DBEAFE] text-[#1D4ED8]"
                  : "bg-[#FCE7F3] text-[#BE185D]"
              }`}
            >
              {identityInitial}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[120px]">
              {identityName}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-[10px] font-semibold shrink-0">
                {(task.assigner || "U").charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[90px]">{task.assigner}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  isGroup
                    ? "bg-[#DBEAFE] text-[#1D4ED8]"
                    : "bg-[#FCE7F3] text-[#BE185D]"
                }`}
              >
                {identityInitial}
              </div>
              <span className="truncate max-w-[90px]">{identityName}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                STATUS_STYLES[task.status]
              }`}
            >
              <StatusIcon
                className={`w-3.5 h-3.5 ${
                  task.status === "in_progress" ? "animate-spin" : ""
                }`}
              />
              {STATUS_LABELS[task.status]}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              Hạn: {task.dueDate}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
              Ưu tiên {task.priority === "high" ? "cao" : task.priority === "medium" ? "trung bình" : "thấp"}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// Component hiển thị người đã giao task cho bạn
function AssignerItem({ assigner, taskCount, isSelected, onClick, isGroup, hasOverdue }) {
  const name = assigner.name;
  const initial = name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition ${
        isSelected
          ? "bg-[#FFF7F0] border-[#FA8DAE] shadow-sm"
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
            isGroup
              ? "bg-[#DBEAFE] text-[#1D4ED8]"
              : "bg-[#FCE7F3] text-[#BE185D]"
          }`}
        >
          {isGroup ? <Users className="w-5 h-5" /> : initial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            {hasOverdue && (
              <span className="shrink-0 w-2 h-2 bg-red-500 rounded-full" title="Có task quá hạn" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              isGroup ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#FCE7F3] text-[#BE185D]"
            }`}>
              {isGroup ? "Nhóm" : "Cá nhân"}
            </span>
            <span className="text-xs text-gray-500">{taskCount} task</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function TasksPage() {
  const {
    tasks,
    loading,
    filter,
    setFilter,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    updateTaskStatus: handleUpdateTaskStatus,
    removeTask: handleTaskDeleted,
    updateTask: handleTaskUpdated,
    submitTask: handleTaskSubmitted,
  } = useTasks();

  const [showAiModal, setShowAiModal] = useState(false);
  const currentTeamId = null;
  const [selectedAssigner, setSelectedAssigner] = useState(null); // Người/nhóm được chọn
  const [showTaskBoard, setShowTaskBoard] = useState(false); // Mobile: show board full screen
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all"); // Mobile: filter theo status

  // Lọc tasks theo filter cũ
  const tasksFiltered = tasks.filter((t) => {
    if (filter === "mine") return true;
    if (filter === "all") return true;
    if (filter === "group") return t.source === "group";
    if (filter === "friend") return t.source === "friend";
    return true;
  });

  // Tạo danh sách người đã giao task cho bạn (group by assignerId)
  const assigners = useMemo(() => {
    const map = new Map();
    const today = new Date().toISOString().split("T")[0];

    tasksFiltered.forEach((task) => {
      // Xác định "người giao" - có thể là assigner hoặc người tạo task
      const assignerId = task.assignerId || task.createdBy;
      const assignerName = task.assigner || task.assignerName || "Người giao";
      const isGroupSource = task.source === "group";
      const sourceId = task.sourceId;

      // Tạo key duy nhất cho người giao
      const key = isGroupSource ? `group:${sourceId}` : `user:${assignerId}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          assignerId: assignerId,
          sourceId: sourceId,
          name: isGroupSource ? (task.sourceName || "Nhóm chat") : assignerName,
          isGroup: isGroupSource,
          tasks: [],
          hasOverdue: false,
        });
      }
      const assigner = map.get(key);
      assigner.tasks.push(task);
      if (task.dueDate && task.dueDate < today && task.status !== "done" && task.status !== "cancelled") {
        assigner.hasOverdue = true;
      }
    });

    // Sort theo số task giảm dần
    return Array.from(map.values()).sort((a, b) => b.tasks.length - a.tasks.length);
  }, [tasksFiltered]);

  // Lọc tasks theo người được chọn
  const displayTasks = useMemo(() => {
    if (!selectedAssigner) return tasksFiltered;
    
    if (selectedAssigner.isGroup) {
      return tasksFiltered.filter(t => 
        t.source === "group" && t.sourceId === selectedAssigner.sourceId
      );
    } else {
      return tasksFiltered.filter(t => 
        t.assignerId === selectedAssigner.assignerId || t.createdBy === selectedAssigner.assignerId
      );
    }
  }, [tasksFiltered, selectedAssigner]);

  const stats = {
    total: displayTasks.length,
    fromGroup: displayTasks.filter((t) => t.source === "group").length,
    fromFriend: displayTasks.filter((t) => t.source === "friend").length,
    pending: displayTasks.filter((t) => t.status === "pending").length,
    done: displayTasks.filter((t) => t.status === "done").length,
    cancelled: displayTasks.filter((t) => t.status === "cancelled").length,
  };

  // Filter tasks theo status (mobile)
  const filteredTasksByStatus = useMemo(() => {
    if (selectedStatusFilter === "all") return displayTasks;
    return displayTasks.filter(t => t.status === selectedStatusFilter);
  }, [displayTasks, selectedStatusFilter]);

  const handleSelectAssigner = (assigner) => {
    if (selectedAssigner?.id === assigner.id) {
      setSelectedAssigner(null); // Deselect
      setShowTaskBoard(false);
    } else {
      setSelectedAssigner(assigner);
      setShowTaskBoard(true); // Mobile: hiện board full screen
      setSelectedStatusFilter("all"); // Reset filter về tất cả
    }
  };

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        {selectedAssigner ? `Tasks từ ${selectedAssigner.name}` : "Công việc đã được giao"}
      </h2>
      <div className="flex items-center gap-3">
        <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
          <ClipboardList className="w-4 h-4" />
          {stats.total} việc
        </span>
      </div>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full h-full bg-[#F3F6FB] flex gap-4 px-3 md:px-6 py-4">
        {/* Desktop: Danh sách người giao task - luôn hiển thị */}
        <aside className="hidden md:flex w-[340px] lg:w-[360px] shrink-0 flex-col gap-3 overflow-hidden">
          <div className="shrink-0 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-600">
              Người đã giao task cho bạn
            </h3>
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FA8DAE] text-white rounded-lg text-xs font-medium hover:opacity-90 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Phân tích AI
            </button>
          </div>

          {/* Stats */}
          <div className="shrink-0 grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-[#FA8DAE]">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Tổng</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] text-gray-500">Chờ làm</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-green-600">{stats.done}</p>
              <p className="text-[10px] text-gray-500">Hoàn thành</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-gray-500">{stats.cancelled}</p>
              <p className="text-[10px] text-gray-500">Đã hủy</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="shrink-0 flex flex-nowrap gap-2">
            {[
              { key: "all", label: "Tất cả", icon: ClipboardList },
              { key: "mine", label: "Của tôi", icon: User },
              { key: "group", label: "Nhóm", icon: Users },
              { key: "friend", label: "Bạn bè", icon: User },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key);
                  setSelectedAssigner(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-medium transition ${
                  filter === key
                    ? "bg-[#FA8DAE] text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Danh sách người giao */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-600 shrink-0 mb-1">
              {selectedAssigner ? (
                <button
                  type="button"
                  onClick={() => setSelectedAssigner(null)}
                  className="text-[#FA8DAE] hover:underline"
                >
                  ← Xem tất cả
                </button>
              ) : (
                <>Người giao ({assigners.length})</>
              )}
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <p className="text-center text-gray-500 text-xs py-4">Đang tải...</p>
              ) : assigners.length > 0 ? (
                assigners.map((assigner) => (
                  <AssignerItem
                    key={assigner.id}
                    assigner={assigner}
                    taskCount={assigner.tasks.length}
                    isSelected={selectedAssigner?.id === assigner.id}
                    onClick={() => handleSelectAssigner(assigner)}
                    isGroup={assigner.isGroup}
                    hasOverdue={assigner.hasOverdue}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Chưa có ai giao task cho bạn</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Desktop: Board công việc - luôn hiển thị */}
        <section className="hidden md:flex flex-1 min-w-0 flex-col overflow-hidden">
          <div className="h-full bg-[#F3F6FB] rounded-2xl border border-gray-200 px-4 py-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Board công việc
              </h3>
              <span className="text-xs text-gray-500">
                {displayTasks.length} task
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { key: "pending", title: "To Do" },
                  { key: "in_progress", title: "In Progress" },
                  { key: "done", title: "Done" },
                  { key: "cancelled", title: "Đã hủy" },
                ].map(({ key, title }) => {
                  const columnTasks = displayTasks.filter((t) => t.status === key);
                  return (
                    <div key={key} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {title} <span className="text-gray-400">({columnTasks.length})</span>
                        </h4>
                        <button type="button" className="text-xs text-gray-400 hover:text-gray-600" title="Tuỳ chọn">⋯</button>
                      </div>
                      <div className="space-y-3">
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={(t) => setSelectedTaskId(t.id)}
                            isSelected={task.id === selectedTaskId}
                          />
                        ))}
                        {columnTasks.length === 0 && (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-3 py-4 text-center text-[11px] text-gray-400">
                            Chưa có task
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile: Toggle giữa danh sách và board */}
        {!showTaskBoard ? (
          /* Mobile: Danh sách người giao */
          <div className="flex md:hidden flex-col gap-3 w-full h-full overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-600">Người đã giao task</h3>
              <button
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FA8DAE] text-white rounded-lg text-xs font-medium"
              >
                <Sparkles className="w-4 h-4" />AI
              </button>
            </div>
            <div className="shrink-0 grid grid-cols-4 gap-2">
              <div className="bg-white rounded-xl border border-gray-200 p-2 text-center">
                <p className="text-lg font-bold text-[#FA8DAE]">{stats.total}</p>
                <p className="text-[9px] text-gray-500">Tổng</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-2 text-center">
                <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
                <p className="text-[9px] text-gray-500">Chờ</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-2 text-center">
                <p className="text-lg font-bold text-green-600">{stats.done}</p>
                <p className="text-[9px] text-gray-500">Xong</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-2 text-center">
                <p className="text-lg font-bold text-gray-500">{stats.cancelled}</p>
                <p className="text-[9px] text-gray-500">Hủy</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {loading ? (
                <p className="text-center text-gray-500 text-xs py-4">Đang tải...</p>
              ) : assigners.length > 0 ? (
                assigners.map((assigner) => (
                  <AssignerItem
                    key={assigner.id}
                    assigner={assigner}
                    taskCount={assigner.tasks.length}
                    isSelected={selectedAssigner?.id === assigner.id}
                    onClick={() => handleSelectAssigner(assigner)}
                    isGroup={assigner.isGroup}
                    hasOverdue={assigner.hasOverdue}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Chưa có ai giao task cho bạn</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile: Board công việc full screen */
          <div className="flex md:hidden flex-1 min-w-0 flex-col overflow-hidden">
            <div className="h-full bg-[#F3F6FB] rounded-2xl border border-gray-200 p-3 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => { setShowTaskBoard(false); setSelectedAssigner(null); }} className="p-2 -ml-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {selectedAssigner ? `Tasks từ ${selectedAssigner.name}` : "Board công việc"}
                  </h3>
                </div>
                <span className="text-xs text-gray-500">{displayTasks.length} task</span>
              </div>

              {/* Status filter tabs - cân bằng */}
              <div className="flex gap-1.5 mb-2">
                {[
                  { key: "all", label: "Tất cả", count: displayTasks.length, color: "all" },
                  { key: "pending", label: "Chờ", count: displayTasks.filter(t => t.status === 'pending').length, color: "pending" },
                  { key: "in_progress", label: "Đang", count: displayTasks.filter(t => t.status === 'in_progress').length, color: "in_progress" },
                  { key: "done", label: "Xong", count: displayTasks.filter(t => t.status === 'done').length, color: "done" },
                  { key: "cancelled", label: "Hủy", count: displayTasks.filter(t => t.status === 'cancelled').length, color: "cancelled" },
                ].map(({ key, label, count, color }) => {
                  const isActive = selectedStatusFilter === key;
                  const colorActive = {
                    all: "bg-[#F9C96D] text-white",
                    pending: "bg-[#F9C96D] text-white",
                    in_progress: "bg-[#F9C96D] text-white",
                    done: "bg-[#F9C96D] text-white",
                    cancelled: "bg-[#F9C96D] text-white",
                  }[color];
                  const colorInactive = "bg-white border border-gray-200 text-gray-600";
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedStatusFilter(key)}
                      className={`flex-1 flex flex-col items-center justify-center px-2 py-2 rounded-lg text-xs font-medium transition ${isActive ? colorActive : colorInactive}`}
                    >
                      <span>{label}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Task list */}
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="space-y-2">
                  {filteredTasksByStatus.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={(t) => setSelectedTaskId(t.id)}
                      isSelected={task.id === selectedTaskId}
                    />
                  ))}
                  {filteredTasksByStatus.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-3 py-8 text-center text-xs text-gray-400">
                      Chưa có task nào
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel chi tiết task dạng slide-over */}
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onUpdateStatus={handleUpdateTaskStatus}
            onTaskSubmitted={handleTaskSubmitted}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onClose={() => setSelectedTaskId(null)}
          />
        )}

        {/* AI Analyze Modal */}
        {showAiModal && (
          <AiAnalyzeModal
            teamId={currentTeamId}
            tasks={tasks}
            onClose={() => setShowAiModal(false)}
          />
        )}
      </div>
    </MainLayout>
  );
}
