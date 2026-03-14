import React, { useState } from "react";
import {
  ClipboardList,
  FileText,
  User,
  Clock,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { taskApi } from "../../api/taskApi";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

function TaskCard({ task, index, friendOptions, onChange }) {
  const [expanded, setExpanded] = useState(index === 0);

  const assigneeOpt = friendOptions.find((f) => f.id === task.assigneeId);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Task {index + 1}
          </span>
          <span className="font-medium text-gray-900 truncate">{task.title}</span>
          {assigneeOpt && (
            <span className="text-xs text-gray-500 truncate">
              → {assigneeOpt.name}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tiêu đề
            </label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => onChange(index, "title", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
              placeholder="Tiêu đề công việc"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mô tả
            </label>
            <textarea
              value={task.description}
              onChange={(e) => onChange(index, "description", e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF] resize-none"
              placeholder="Mô tả chi tiết"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Người thực hiện <span className="text-[#FA8DAE]">*</span>
            </label>
            <select
              value={task.assigneeId || ""}
              onChange={(e) => {
                const opt = friendOptions.find((o) => o.id === e.target.value);
                onChange(index, "assigneeId", e.target.value || null);
                onChange(index, "assigneeName", opt ? opt.name : "");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF] bg-white"
            >
              <option value="">— Chọn người nhận —</option>
              {friendOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Hạn hoàn thành
              </label>
              <input
                type="text"
                value={task.dueDate || ""}
                onChange={(e) => onChange(index, "dueDate", e.target.value)}
                placeholder="VD: 20/03/2025"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ưu tiên
              </label>
              <select
                value={task.priority || "medium"}
                onChange={(e) => onChange(index, "priority", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF] bg-white"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ước lượng effort
            </label>
            <input
              type="text"
              value={task.estimatedEffort || ""}
              onChange={(e) => onChange(index, "estimatedEffort", e.target.value)}
              placeholder="VD: 2 ngày"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Kết quả mong đợi (mỗi dòng 1 mục)
            </label>
            <textarea
              value={
                Array.isArray(task.expectedResults)
                  ? task.expectedResults.join("\n")
                  : typeof task.expectedResults === "string"
                    ? task.expectedResults
                    : ""
              }
              onChange={(e) =>
                onChange(
                  index,
                  "expectedResults",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              rows={2}
              placeholder="Mỗi dòng 1 kết quả"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tiêu chí nghiệm thu (mỗi dòng 1 mục)
            </label>
            <textarea
              value={
                Array.isArray(task.acceptanceCriteria)
                  ? task.acceptanceCriteria
                      .map((c) => (typeof c === "string" ? c : c?.text || ""))
                      .join("\n")
                  : ""
              }
              onChange={(e) =>
                onChange(
                  index,
                  "acceptanceCriteria",
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((text) => ({ text, checked: false }))
                )
              }
              rows={2}
              placeholder="Mỗi dòng 1 tiêu chí"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6CB8FF] focus:ring-1 focus:ring-[#6CB8FF] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTasksFromAiModal({
  tasks: initialTasks,
  assignerId,
  assignerName,
  friendOptions = [],
  onClose,
  onSuccess,
}) {
  const [tasks, setTasks] = useState(
    (initialTasks || []).map((t) => ({
      title: t.title || "",
      description: t.description || "",
      assigneeId: null,
      assigneeName: null,
      dueDate: t.dueDate || "",
      priority: t.priority || "medium",
      estimatedEffort: t.estimatedEffort || "",
      expectedResults: Array.isArray(t.expectedResults)
        ? t.expectedResults
        : [],
      acceptanceCriteria: Array.isArray(t.acceptanceCriteria)
        ? t.acceptanceCriteria.map((c) =>
            typeof c === "string" ? { text: c, checked: false } : c
          )
        : [],
      risksNotes: t.risksNotes || "",
    }))
  );
  const [creating, setCreating] = useState(false);

  const handleTaskChange = (index, field, value) => {
    setTasks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = tasks.filter((t) => !t.assigneeId || !t.assigneeName);
    if (missing.length > 0) {
      toast.error("Vui lòng chọn người thực hiện cho tất cả các task.");
      return;
    }
    const invalid = tasks.filter((t) => !(t.title || "").trim());
    if (invalid.length > 0) {
      toast.error("Mỗi task cần có tiêu đề.");
      return;
    }
    if (!assignerId || !assignerName) {
      toast.error("Bạn cần đăng nhập để tạo task.");
      return;
    }

    try {
      setCreating(true);
      for (const t of tasks) {
        await taskApi.create({
          title: (t.title || "").trim(),
          description: (t.description || "").trim(),
          assignerId,
          assignerName,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          source: "friend",
          sourceName: "Chatbot AI",
          dueDate: t.dueDate || "",
          estimatedEffort: t.estimatedEffort || "",
          expectedResults: Array.isArray(t.expectedResults)
            ? t.expectedResults
            : [],
          acceptanceCriteria: Array.isArray(t.acceptanceCriteria)
            ? t.acceptanceCriteria
            : [],
          risksNotes: t.risksNotes || "",
          priority: t.priority || "medium",
        });
      }
      toast.success(`Đã tạo ${tasks.length} task thành công.`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || "Không thể tạo task.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3"
      onClick={onClose}
    >
      <div
        className="bg-[#F3F6FB] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#E2E8F0] bg-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#6CB8FF]" />
            <h3 className="text-base font-bold text-gray-900">
              Tạo task từ AI — Chọn người thực hiện
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {friendOptions.length === 0 && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Bạn chưa có bạn bè. Thêm bạn bè để giao task.
            </p>
          )}
          {tasks.map((task, idx) => (
            <TaskCard
              key={idx}
              task={task}
              index={idx}
              friendOptions={friendOptions}
              onChange={handleTaskChange}
            />
          ))}
        </div>

        <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={creating || friendOptions.length === 0}
            className="px-4 py-2 rounded-xl bg-[#6CB8FF] text-white hover:bg-[#5AA3E8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Đang tạo..." : `Tạo ${tasks.length} task`}
          </button>
        </div>
      </div>
    </div>
  );
}
