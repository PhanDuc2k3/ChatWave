import React from "react";
import {
  ClipboardList,
  Users,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { useTasks } from "../../hooks/useTasks";
import TaskDetail from "./TaskDetail";

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
            {/* Avt + tên người giao */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#E0F2FE] text-[#0369A1] flex items-center justify-center text-[10px] font-semibold shrink-0">
                {(task.assigner || "U").charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[90px]">{task.assigner}</span>
            </div>

            <span>·</span>

            {/* Avt + tên người nhận hoặc nhóm */}
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
              <span className="truncate max-w-[90px]">
                {identityName}
              </span>
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

  const tasksFiltered = tasks.filter((t) => {
    if (filter === "mine") return true;
    if (filter === "all") return true;
    if (filter === "group") return t.source === "group";
    if (filter === "friend") return t.source === "friend";
    return true;
  });

  const stats = {
    total: tasks.length,
    fromGroup: tasks.filter((t) => t.source === "group").length,
    fromFriend: tasks.filter((t) => t.source === "friend").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    done: tasks.filter((t) => t.status === "done").length,
    cancelled: tasks.filter((t) => t.status === "cancelled").length,
  };

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h2 className="text-sm md:text-base font-semibold text-gray-800">
        Công việc đã được giao
      </h2>
      <span className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
        <ClipboardList className="w-4 h-4" />
        {stats.total} việc
      </span>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full h-full bg-[#F3F6FB] flex gap-4 px-3 md:px-6 py-4">
        {/* Trái: danh sách task */}
        <aside className="w-full md:w-[340px] lg:w-[360px] shrink-0 flex flex-col gap-3 overflow-hidden">
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
              <p className="text-xl font-bold text-gray-500">{stats.cancelled}</p>
              <p className="text-[10px] text-gray-500">Đã hủy</p>
            </div>
          </div>

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
                onClick={() => setFilter(key)}
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

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-600 shrink-0 mb-1">
              {filter === "all" && "Tất cả công việc"}
              {filter === "mine" && "Công việc được giao cho tôi"}
              {filter === "group" && "Từ nhóm chat"}
              {filter === "friend" && "Từ bạn bè"}
              <span className="text-gray-400 font-normal ml-1">({tasksFiltered.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <p className="text-center text-gray-500 text-xs py-4">Đang tải...</p>
              ) : tasksFiltered.length > 0 ? (
                tasksFiltered.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={(t) => setSelectedTaskId(t.id)}
                    isSelected={task.id === selectedTaskId}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Không có công việc nào</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Phải: board 3 cột theo trạng thái giống kanban */}
        <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="h-full bg-[#F3F6FB] rounded-2xl border border-gray-200 px-4 py-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Board công việc
              </h3>
              <span className="text-xs text-gray-500">
                {tasksFiltered.length} task
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
                  const columnTasks = tasksFiltered.filter(
                    (t) => t.status === key
                  );
                  return (
                    <div key={key} className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {title}{" "}
                          <span className="text-gray-400">
                            ({columnTasks.length})
                          </span>
                        </h4>
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-gray-600"
                          title="Tuỳ chọn"
                        >
                          ⋯
                        </button>
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
      </div>
    </MainLayout>
  );
}
