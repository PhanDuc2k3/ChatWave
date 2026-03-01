import React, { useState } from "react";
import {
  ClipboardList,
  Users,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import { mockAssignedTasks } from "./tasksData";
import TaskDetail from "./TaskDetail";

const STATUS_LABELS = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Đã xong",
};

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  done: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_ICONS = {
  pending: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
};

const PRIORITY_STYLES = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-gray-500",
};

function TaskCard({ task, onClick, isSelected }) {
  const StatusIcon = STATUS_ICONS[task.status];

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
          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{task.assigner}</span>
            <span>·</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${
                task.source === "group" ? "bg-[#6CB8FF]/10 text-[#6CB8FF]" : "bg-[#F9C96D]/20 text-[#B8860B]"
              }`}
            >
              {task.source === "group" ? (
                <Users className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              {task.sourceName}
            </span>
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
  const [filter, setFilter] = useState("all"); // all | group | friend
  const [tasks, setTasks] = useState(() => [...mockAssignedTasks]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const selectedTask = selectedTaskId != null ? tasks.find((t) => t.id === selectedTaskId) : null;

  const handleUpdateTaskStatus = (taskId, status) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  const tasksFiltered = tasks.filter((t) => {
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
      <div className="w-full flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Trái: danh sách task */}
        <aside className="w-full md:w-[380px] shrink-0 flex flex-col gap-3 overflow-hidden">
          <div className="shrink-0 grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-[#FA8DAE]">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Tổng</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] text-gray-500">Chờ làm</p>
            </div>
          </div>

          <div className="shrink-0 flex gap-2">
            {[
              { key: "all", label: "Tất cả", icon: ClipboardList },
              { key: "group", label: "Nhóm", icon: Users },
              { key: "friend", label: "Bạn bè", icon: User },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
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
              {filter === "group" && "Từ nhóm"}
              {filter === "friend" && "Từ bạn bè"}
              <span className="text-gray-400 font-normal ml-1">({tasksFiltered.length})</span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {tasksFiltered.length > 0 ? (
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

        {/* Phải: chi tiết task hoặc empty state */}
        <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedTask ? (
            <TaskDetail
              task={selectedTask}
              onUpdateStatus={handleUpdateTaskStatus}
              onClose={() => setSelectedTaskId(null)}
              inline
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-200">
              <div className="text-center text-gray-400">
                <ClipboardList className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Chọn một task để xem chi tiết</p>
                <p className="text-xs mt-1">Bấm vào task ở danh sách bên trái</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
