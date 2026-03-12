import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardList,
  FileText,
  User,
  Clock,
  Zap,
  X,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { taskApi } from "../../api/taskApi";
import { chatGroupApi } from "../../api/chatGroupApi";

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        {Icon && <Icon className="w-4 h-4 text-[#FA8DAE]" />}
        {title}
      </h4>
      <div className="pl-6 text-sm text-gray-700">{children}</div>
    </div>
  );
}

const PRIORITY_LABELS = { high: "Cao", medium: "Trung bình", low: "Thấp" };

export default function CreateTaskModal({
  selectedChat,
  currentUserId,
  onClose,
  onSuccess,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [creating, setCreating] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [loadingAssignees, setLoadingAssignees] = useState(true);
  const [reviewerId, setReviewerId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [estimatedEffort, setEstimatedEffort] = useState("");
  const [expectedResults, setExpectedResults] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [risksNotes, setRisksNotes] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
    } catch {
      return null;
    }
  }, []);
  const assignerId = currentUser?.id || currentUser?._id;
  const assignerName =
    currentUser?.username || currentUser?.email || currentUser?.name || "Bạn";

  const isGroupChat = selectedChat?.id?.startsWith("group:");
  const source = isGroupChat ? "group" : "friend";
  const sourceId = isGroupChat ? selectedChat?.chatGroupId : selectedChat?.id;
  const sourceName = selectedChat?.name || "Cuộc trò chuyện";

  // Build assignee list: direct = đối phương, group = danh sách thành viên (trừ mình)
  useEffect(() => {
    let cancelled = false;

    if (!selectedChat || !currentUserId) {
      setAssigneeOptions([]);
      setLoadingAssignees(false);
      return;
    }

    const run = async () => {
      setLoadingAssignees(true);
      try {
        if (isGroupChat && selectedChat.chatGroupId) {
          const group = await chatGroupApi.getById(selectedChat.chatGroupId);
          const members = (group?.members || []).filter(
            (m) => String(m.userId) !== String(currentUserId)
          );
          if (!cancelled) {
            setAssigneeOptions(
              members.map((m) => ({
                id: m.userId,
                displayName: m.displayName,
              }))
            );
            if (members.length > 0 && !assigneeId) {
              setAssigneeId(members[0].userId);
              setAssigneeName(members[0].displayName);
            }
          }
        } else {
          const convId = String(selectedChat.id || "");
          if (convId.startsWith("direct:") && currentUserId) {
            const parts = convId.split(":");
            if (parts.length >= 3) {
              const [, u1, u2] = parts;
              const otherId =
                String(u1) === String(currentUserId) ? u2 : u1;
              const otherName = selectedChat.name || "Đối phương";
              if (!cancelled) {
                setAssigneeOptions([{ id: otherId, displayName: otherName }]);
                setAssigneeId(otherId);
                setAssigneeName(otherName);
              }
            }
          }
          if (!cancelled && !convId.startsWith("direct:")) {
            setAssigneeOptions([]);
          }
        }
      } catch {
        if (!cancelled) setAssigneeOptions([]);
      } finally {
        if (!cancelled) setLoadingAssignees(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedChat?.id, selectedChat?.chatGroupId, selectedChat?.name, currentUserId, isGroupChat]);

  const handleAssigneeChange = (e) => {
    const id = e.target.value;
    const opt = assigneeOptions.find((o) => o.id === id);
    setAssigneeId(id);
    setAssigneeName(opt ? opt.displayName : "");
  };

  const handleReviewerChange = (e) => {
    const id = e.target.value;
    const opt = assigneeOptions.find((o) => o.id === id);
    setReviewerId(id);
    setReviewerName(opt ? opt.displayName : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast.error("Vui lòng nhập tiêu đề công việc.");
      return;
    }
    if (!assignerId) {
      toast.error("Bạn cần đăng nhập để giao việc.");
      return;
    }
    try {
      setCreating(true);
      await taskApi.create({
        title: t,
        description: description.trim(),
        assignerId,
        assignerName,
        assigneeId: assigneeId || null,
        assigneeName: assigneeName || null,
        reviewerId: reviewerId || null,
        reviewerName: reviewerName || null,
        source,
        sourceId,
        sourceName,
        dueDate: dueDate || null,
        estimatedEffort: estimatedEffort.trim() || null,
        expectedResults: expectedResults.trim()
          ? expectedResults.trim().split("\n").filter(Boolean)
          : [],
        acceptanceCriteria: acceptanceCriteria.trim()
          ? acceptanceCriteria.trim().split("\n").filter(Boolean).map((text) => ({ text, checked: false }))
          : [],
        risksNotes: risksNotes.trim() || null,
        priority,
      });
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setAssigneeName("");
      setReviewerId("");
      setReviewerName("");
      setDueDate("");
      setEstimatedEffort("");
      setExpectedResults("");
      setAcceptanceCriteria("");
      setRisksNotes("");
      setPriority("medium");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || "Không thể giao việc.");
    } finally {
      setCreating(false);
    }
  };

  const dueDateValue =
    dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
      ? dueDate
      : "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header giống TaskDetail */}
        <div className="shrink-0 border-b border-gray-200 bg-[#FFF9F2] px-4 py-3 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="w-5 h-5 text-[#FA8DAE] shrink-0" />
            <h3 className="text-base font-bold text-gray-900 truncate">
              Giao việc — {sourceName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-6"
        >
          <Section title="Tiêu đề công việc" icon={ClipboardList}>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
              placeholder="VD: Chuẩn bị slide báo cáo tuần"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Section>

          <Section title="Mô tả chi tiết" icon={FileText}>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[80px]"
              placeholder="Mô tả công việc, phạm vi, mục đích..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Section>

          <Section title="Người thực hiện & người review" icon={User}>
            {loadingAssignees ? (
              <p className="text-xs text-gray-500">Đang tải danh sách...</p>
            ) : assigneeOptions.length > 0 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Thực hiện
                  </label>
                  <select
                    value={assigneeId}
                    onChange={handleAssigneeChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] bg-white"
                  >
                    <option value="">— Chọn người nhận —</option>
                    {assigneeOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Review (tuỳ chọn)
                  </label>
                  <select
                    value={reviewerId}
                    onChange={handleReviewerChange}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] bg-white"
                  >
                    <option value="">— Chưa chọn —</option>
                    {assignerId && (
                      <option value={assignerId}>{assignerName} (Tôi)</option>
                    )}
                    {assigneeOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Không có người nào trong cuộc trò chuyện để giao việc.
              </p>
            )}
          </Section>

          <Section title="Thời gian" icon={Clock}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hạn hoàn thành
                </label>
                <input
                  type="date"
                  value={dueDateValue}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ước lượng effort (tuỳ chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: 2–3 giờ"
                  value={estimatedEffort}
                  onChange={(e) => setEstimatedEffort(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
                />
              </div>
            </div>
          </Section>

          <Section title="Mục tiêu / Kết quả mong đợi" icon={Target}>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[60px]"
              placeholder="Mỗi dòng một kết quả mong đợi..."
              value={expectedResults}
              onChange={(e) => setExpectedResults(e.target.value)}
            />
          </Section>

          <Section title="Acceptance Criteria (tuỳ chọn)" icon={CheckCircle2}>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[60px]"
              placeholder="Mỗi dòng một tiêu chí hoàn thành..."
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
            />
          </Section>

          <Section title="Rủi ro / Lưu ý (tuỳ chọn)" icon={AlertTriangle}>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] resize-none min-h-[50px]"
              placeholder="Ghi chú về rủi ro, phụ thuộc..."
              value={risksNotes}
              onChange={(e) => setRisksNotes(e.target.value)}
            />
          </Section>

          <Section title="Độ ưu tiên" icon={Zap}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] bg-white max-w-[200px]"
            >
              <option value="low">{PRIORITY_LABELS.low}</option>
              <option value="medium">{PRIORITY_LABELS.medium}</option>
              <option value="high">{PRIORITY_LABELS.high}</option>
            </select>
          </Section>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={creating || loadingAssignees}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FA8DAE] text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Đang giao..." : "Giao việc"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
