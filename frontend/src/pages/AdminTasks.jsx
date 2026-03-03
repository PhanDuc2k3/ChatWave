import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import TasksPage from "./Tasks/TasksPage";
import { mockAssignedTasks } from "./Tasks/tasksData";
import { ClipboardList, Filter, Users, User, CheckCircle2, Loader2, Circle } from "lucide-react";

const STATUS_LABELS = {
  pending: "Chờ làm",
  in_progress: "Đang làm",
  done: "Đã xong",
};

export default function AdminTasks() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const tasks = mockAssignedTasks;

  const filtered = tasks.filter((t) => {
    const matchStatus =
      statusFilter === "all" ? true : t.status === statusFilter;
    const matchSource =
      sourceFilter === "all"
        ? true
        : sourceFilter === "group"
        ? t.source === "group"
        : t.source === "friend";
    return matchStatus && matchSource;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const headerContent = (
    <div className="w-full flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm md:text-base font-semibold text-gray-800">
          Quản lý task (Admin)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Theo dõi tiến độ các task đã giao cho thành viên.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <ClipboardList className="w-4 h-4" />
        <span>{stats.total} task</span>
      </div>
    </div>
  );

  return (
    <MainLayout headerContent={headerContent}>
      <div className="w-full flex flex-col gap-4 py-3 pb-6">
        {/* Bộ lọc tổng quan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
            <Filter className="w-4 h-4 text-[#FA8DAE]" />
            <span>Bộ lọc</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-500">Trạng thái:</span>
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ làm" },
              { key: "in_progress", label: "Đang làm" },
              { key: "done", label: "Đã xong" },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1 rounded-full border text-xs font-medium transition ${
                  statusFilter === opt.key
                    ? "bg-[#FA8DAE] text-white border-[#FA8DAE]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-500">Nguồn:</span>
            {[
              { key: "all", label: "Tất cả" },
              { key: "group", label: "Nhóm", icon: Users },
              { key: "friend", label: "Bạn bè", icon: User },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSourceFilter(key)}
                className={`px-3 py-1 rounded-full border text-xs font-medium inline-flex items-center gap-1 transition ${
                  sourceFilter === key
                    ? "bg-[#6CB8FF] text-white border-[#6CB8FF]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
            <span>Chờ làm: {stats.pending}</span>
            <span>Đang làm: {stats.inProgress}</span>
            <span>Đã xong: {stats.done}</span>
          </div>
        </div>

        {/* Bảng theo dõi nhanh */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1.2fr,1.8fr] gap-2">
            <span>Task</span>
            <span>Người giao</span>
            <span>Nguồn</span>
            <span>Deadline</span>
            <span>Trạng thái</span>
            <span>Hoàn thành lúc</span>
            <span>Nội dung gửi</span>
          </div>
          <div className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500">
                Không có task phù hợp bộ lọc.
              </div>
            ) : (
              filtered.map((task) => {
                const StatusIcon =
                  task.status === "pending"
                    ? Circle
                    : task.status === "in_progress"
                    ? Loader2
                    : CheckCircle2;
                const statusColor =
                  task.status === "pending"
                    ? "text-amber-600"
                    : task.status === "in_progress"
                    ? "text-blue-600"
                    : "text-green-600";

                return (
                  <div
                    key={task.id}
                    className="px-4 py-2 text-xs grid grid-cols-[1.5fr,1fr,1fr,1fr,1fr,1.2fr,1.8fr] gap-2 items-center hover:bg-[#FFF9F2]"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 line-clamp-1">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        ID: {task.id}
                      </span>
                    </div>
                    <span className="text-gray-700">{task.assigner}</span>
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      {task.source === "group" ? (
                        <Users className="w-3.5 h-3.5" />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                      {task.sourceName}
                    </span>
                    <span className="text-gray-700">{task.dueDate}</span>
                    <span
                      className={`inline-flex items-center gap-1 ${statusColor}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {STATUS_LABELS[task.status]}
                    </span>
                    <span className="text-gray-700">
                      {task.status === "done" && task.completedAt
                        ? task.completedAt
                        : "-"}
                    </span>
                    <span className="text-gray-600 line-clamp-1">
                      {task.status === "done" && task.completionNote
                        ? task.completionNote
                        : "-"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

