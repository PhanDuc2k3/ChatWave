import React, { useState } from "react";
import toast from "react-hot-toast";
import { useConfirm } from "../../context/ConfirmContext";
import { uploadApi } from "../../api/uploadApi";
import { taskApi } from "../../api/taskApi";
import {
  X,
  ClipboardList,
  Users,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  Link2,
  AlertTriangle,
  Target,
  Calendar,
  Zap,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";

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

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

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

function EmptyNote() {
  return <span className="text-gray-400 italic">Chưa có thông tin</span>;
}

export default function TaskDetail({ task, onUpdateStatus, onClose, onTaskSubmitted, onTaskUpdated, onTaskDeleted, inline = false }) {
  const { confirm } = useConfirm();
  if (!task) return null;

  const StatusIcon = STATUS_ICONS[task.status];
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [completionComment, setCompletionComment] = useState("");
  const [submittedInfo, setSubmittedInfo] = useState(() => {
    if (task.completedAt || task.completionNote || (task.submissionDeliverables && task.submissionDeliverables.length > 0)) {
      return {
        timeLabel: task.completedAt ? new Date(task.completedAt).toLocaleString() : null,
        filesCount: task.submissionDeliverables?.length || 0,
        comment: task.completionNote || null,
      };
    }
    return null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editPayload, setEditPayload] = useState({});
  const [saving, setSaving] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("chatwave_user") || "null") || null;
  const currentUserId = storedUser?.id || storedUser?._id;
  const isAssigner = String(task.assignerId) === String(currentUserId);
  const isAssignee = String(task.assigneeId) === String(currentUserId);
  const canCancel = (isAssigner || isAssignee) && task.status !== "done" && task.status !== "cancelled";

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSubmissionFiles(files);
  };

  const handleSubmitCompletion = async () => {
    const hasContent =
      submissionFiles.length > 0 || completionComment.trim().length > 0;
    if (!hasContent) return;

    setSubmitting(true);
    try {
      const submissionDeliverables = [];
      for (let i = 0; i < submissionFiles.length; i++) {
        const file = submissionFiles[i];
        if (!file.type.startsWith("image/")) {
          toast.error(`File "${file.name}" không phải ảnh. Chỉ hỗ trợ ảnh (jpg, png, gif, webp).`);
          setSubmitting(false);
          return;
        }
        const data = await uploadApi.uploadImage(file);
        if (data?.url) {
          submissionDeliverables.push({ label: file.name, link: data.url });
        }
      }

      const updated = await taskApi.submitTask(task.id, {
        completionNote: completionComment.trim() || "",
        submissionDeliverables,
      });

      if (onUpdateStatus && task.status !== "done") {
        onUpdateStatus(task.id, "done");
      }

      setSubmittedInfo({
        timeLabel: updated?.completedAt ? new Date(updated.completedAt).toLocaleString() : new Date().toLocaleString(),
        filesCount: submissionDeliverables.length,
        comment: completionComment.trim() || null,
      });
      setSubmissionFiles([]);
      setCompletionComment("");
      toast.success("Đã nộp task thành công.");
      if (onTaskSubmitted) onTaskSubmitted(updated);
    } catch (err) {
      toast.error(err?.message || "Nộp task thất bại.");
    } finally {
      setSubmitting(false);
    }
  };
  const hasDescription = (() => {
    if (!task.description) return false;
    if (typeof task.description === "string") return task.description.trim().length > 0;
    return (
      task.description.what ||
      task.description.purpose ||
      (task.description.scopeDo && task.description.scopeDo.length) ||
      (task.description.scopeDont && task.description.scopeDont.length)
    );
  })();
  const hasPeople = task.assignee || task.reviewer;
  const hasAcceptance = task.acceptanceCriteria && task.acceptanceCriteria.length > 0;
  const hasDeliverables = task.deliverables && task.deliverables.length > 0;
  const hasReferences = task.references && task.references.length > 0;
  const hasRisksNotes = task.risksNotes && task.risksNotes.trim();
  const isGroup = task.source === "group";
  const identityName = isGroup
    ? task.sourceName || "Nhóm chat"
    : task.assignee || task.assigner || "Người dùng";
  const identityInitial = identityName.charAt(0).toUpperCase();

  const inner = (
    <>
      <div className={`shrink-0 border-b border-gray-200 bg-[#FFF9F2] px-4 py-3 flex items-start justify-between gap-3 ${inline ? "rounded-t-2xl" : ""}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${STATUS_STYLES[task.status]}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${task.status === "in_progress" ? "animate-spin" : ""}`} />
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${PRIORITY_STYLES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border bg-[#6CB8FF]/10 text-[#6CB8FF] text-xs">
              {task.source === "group" ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              {task.sourceName}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                isGroup
                  ? "bg-[#DBEAFE] text-[#1D4ED8]"
                  : "bg-[#FCE7F3] text-[#BE185D]"
              }`}
            >
              {identityInitial}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {task.title}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {isGroup
                  ? `Giao từ nhóm: ${task.sourceName}`
                  : `Giao cho: ${task.assignee || "Chưa giao"}`}{" "}
                · Giao bởi {task.assigner}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAssigner && onTaskUpdated && (
            <>
              <button type="button" onClick={() => { setShowEdit(true); setEditPayload({
                title: task.title,
                description: typeof task.description === "object" && task.description !== null ? task.description : { what: task.description || "", purpose: "", scopeDo: [], scopeDont: [] },
                dueDate: task.dueDate || "",
                priority: task.priority || "medium",
              }); }} title="Sửa task" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-[#FA8DAE]/20 hover:text-[#FA8DAE]">
                <Pencil className="w-4 h-4" />
              </button>
              {onTaskDeleted && (
                <button type="button" onClick={async () => { if (await confirm("Xóa task này?")) { try { await taskApi.delete(task.id); toast.success("Đã xóa task."); onTaskDeleted(task.id); } catch (e) { toast.error(e?.message || "Không xóa được."); } } }} title="Xóa task" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="shrink-0 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700" aria-label="Đóng">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* 2. Mô tả chi tiết */}
          <Section title="Mô tả chi tiết" icon={FileText}>
            {hasDescription ? (
              typeof task.description === "string" ? (
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <div className="space-y-3">
                  {task.description.what && (
                    <div>
                      <p className="font-medium text-gray-800">Task này làm gì</p>
                      <p className="text-gray-600">{task.description.what}</p>
                    </div>
                  )}
                  {task.description.purpose && (
                    <div>
                      <p className="font-medium text-gray-800">Mục đích / bối cảnh</p>
                      <p className="text-gray-600">{task.description.purpose}</p>
                    </div>
                  )}
                  {(task.description.scopeDo?.length > 0 || task.description.scopeDont?.length > 0) && (
                    <div>
                      <p className="font-medium text-gray-800 mb-1">Phạm vi làm và không làm</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {task.description.scopeDo?.map((item, i) => (
                          <li key={`do-${i}`}>{item}</li>
                        ))}
                        {task.description.scopeDont?.map((item, i) => (
                          <li key={`dont-${i}`} className="text-amber-700">
                            <span className="font-medium">Không:</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 3. Mục tiêu / Kết quả mong đợi */}
          <Section title="Mục tiêu / Kết quả mong đợi" icon={Target}>
            {task.expectedResults && task.expectedResults.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {task.expectedResults.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 4. Người thực hiện & người review */}
          <Section title="Người thực hiện & người review" icon={User}>
            {hasPeople ? (
              <div className="space-y-1">
                <p><span className="font-medium">Thực hiện:</span> {task.assignee || <EmptyNote />}</p>
                <p><span className="font-medium">Review:</span> {task.reviewer ?? <EmptyNote />}</p>
              </div>
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 5. Thời gian */}
          <Section title="Thời gian" icon={Clock}>
            <div className="space-y-1">
              <p><span className="font-medium">Deadline:</span> {task.dueDate || <EmptyNote />}</p>
              <p><span className="font-medium">Ước lượng effort:</span> {task.estimatedEffort || <EmptyNote />}</p>
            </div>
          </Section>

          {/* 6. Độ ưu tiên */}
          <Section title="Độ ưu tiên" icon={Zap}>
            <span className={`inline-flex px-2 py-1 rounded-lg text-sm font-medium border ${PRIORITY_STYLES[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </Section>

          {/* 7. Acceptance Criteria */}
          <Section title="Acceptance Criteria (tiêu chí hoàn thành)" icon={CheckCircle2}>
            {hasAcceptance ? (
              <ul className="space-y-2">
                {task.acceptanceCriteria.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">
                      {item.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </span>
                    <span className={item.checked ? "text-gray-500 line-through" : ""}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote />
            )}
          </Section>

          <Section title="Deliverables (sản phẩm bàn giao)" icon={Link2}>
            {hasDeliverables ? (
              <ul className="space-y-1">
                {task.deliverables.map((d, i) => (
                  <li key={i}>
                    {d.link ? (
                      <a
                        href={d.link}
                        className="text-[#6CB8FF] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {d.label}
                      </a>
                    ) : (
                      <span>{d.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 9. Tài liệu tham chiếu */}
          <Section title="Tài liệu tham chiếu" icon={FileText}>
            {hasReferences ? (
              <ul className="space-y-1">
                {task.references.map((r, i) => (
                  <li key={i}>
                    {r.link ? (
                      <a
                        href={r.link}
                        className="text-[#6CB8FF] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.label}
                      </a>
                    ) : (
                      <span>{r.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 10. Rủi ro / Lưu ý / Phụ thuộc */}
          <Section title="Rủi ro / Lưu ý / Phụ thuộc" icon={AlertTriangle}>
            {hasRisksNotes ? (
              <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {task.risksNotes}
              </p>
            ) : (
              <EmptyNote />
            )}
          </Section>

          {/* 11. Gửi file & comment khi hoàn thành */}
          {task.status !== "cancelled" && (
          <Section title="Gửi file & comment khi hoàn thành" icon={FileText}>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Đính kèm file bàn giao và để lại lời nhắn khi bạn hoàn thành task này.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  File bàn giao
                </label>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-600 cursor-pointer hover:border-[#FA8DAE] hover:bg-[#FFF7F0] transition">
                  <FileText className="w-4 h-4 text-[#FA8DAE]" />
                  <span>Chọn file từ máy</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </label>
                {submissionFiles.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5 mt-1">
                    {submissionFiles.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  Comment khi hoàn thành
                </label>
                <textarea
                  rows={3}
                  value={completionComment}
                  onChange={(e) => setCompletionComment(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#FA8DAE]/50 focus:border-[#FA8DAE]"
                  placeholder="Mô tả ngắn gọn những gì bạn đã làm, lưu ý cho người giao task..."
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-gray-400">
                  Bạn có thể gửi file và comment bất cứ lúc nào; nếu chưa ở trạng thái{" "}
                  <span className="font-medium">Đã xong</span>, hệ thống sẽ tự đánh dấu giúp bạn.
                </p>
                <button
                  type="button"
                  onClick={handleSubmitCompletion}
                  disabled={
                    submitting ||
                    (submissionFiles.length === 0 &&
                    completionComment.trim().length === 0)
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    submitting ||
                    (submissionFiles.length === 0 &&
                    completionComment.trim().length === 0)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#FA8DAE] text-white shadow-sm hover:bg-[#F9789E]"
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {submitting ? "Đang gửi..." : "Gửi & đánh dấu đã xong"}
                </button>
              </div>

              {submittedInfo && (
                <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1 space-y-1">
                  <p>
                    Đã lưu thông tin hoàn thành lúc{" "}
                    <span className="font-semibold">{submittedInfo.timeLabel}</span>
                    {submittedInfo.filesCount > 0 && (
                      <> · {submittedInfo.filesCount} file</>
                    )}
                    {submittedInfo.comment && (
                      <> · Comment: <span className="italic">{submittedInfo.comment}</span></>
                    )}
                  </p>
                  {task.submissionDeliverables && task.submissionDeliverables.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5">
                      {task.submissionDeliverables.map((d, i) => (
                        <li key={i}>
                          {d.link ? (
                            <a href={d.link} target="_blank" rel="noopener noreferrer" className="text-[#059669] hover:underline">
                              {d.label || `File ${i + 1}`}
                            </a>
                          ) : (
                            <span>{d.label || `File ${i + 1}`}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </Section>
          )}

          {/* 12. Trạng thái task */}
          <Section title="Trạng thái task" icon={ClipboardList}>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Luồng trạng thái: <span className="font-medium">Chờ làm → Đang làm → Đã xong</span>.
              </p>

              {task.status === "pending" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 max-w-[60%]">
                      Hiện tại task đang ở trạng thái{" "}
                      <span className="font-medium text-amber-700">Chờ làm</span>.
                      Bấm nút bên phải khi bạn xác nhận và bắt đầu làm task này.
                    </p>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus?.(task.id, "in_progress")}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shrink-0"
                    >
                      <Loader2 className="w-4 h-4" />
                      Bắt đầu làm
                    </button>
                  </div>
                  {canCancel && onUpdateStatus && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!(await confirm("Hủy task này?"))) return;
                        try {
                          await taskApi.updateStatus(task.id, "cancelled");
                          toast.success("Đã hủy task.");
                          onUpdateStatus(task.id, "cancelled");
                        } catch (e) {
                          toast.error(e?.message || "Không hủy được task.");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Hủy task
                    </button>
                  )}
                </div>
              )}

              {task.status === "in_progress" && (
                <div className="space-y-2">
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Bạn đang <span className="font-semibold">Đang làm</span> task này. Khi hoàn thành,
                    hãy dùng mục <span className="font-semibold">Gửi file & comment khi hoàn thành</span>{" "}
                    phía trên để submit, hệ thống sẽ tự chuyển sang trạng thái{" "}
                    <span className="font-semibold">Đã xong</span>.
                  </p>
                  {canCancel && onUpdateStatus && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!(await confirm("Hủy task này?"))) return;
                        try {
                          await taskApi.updateStatus(task.id, "cancelled");
                          toast.success("Đã hủy task.");
                          onUpdateStatus(task.id, "cancelled");
                        } catch (e) {
                          toast.error(e?.message || "Không hủy được task.");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Hủy task
                    </button>
                  )}
                </div>
              )}

              {task.status === "done" && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Task đã ở trạng thái <span className="font-semibold">Đã xong</span>. Bạn vẫn có thể
                  xem lại file bàn giao và comment ở phía trên nếu cần.
                </p>
              )}

              {task.status === "cancelled" && (
                <p className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                  Task đã được <span className="font-semibold">hủy</span>.
                </p>
              )}
            </div>
          </Section>
        </div>
    </>
  );

  const handleSaveEdit = async () => {
    if (!editPayload.title?.trim()) {
      toast.error("Tiêu đề không được để trống.");
      return;
    }
    setSaving(true);
    try {
      // Xử lý description
      let descriptionToSend = typeof editPayload.description === "object" ? editPayload.description : { what: editPayload.description || "", purpose: "", scopeDo: [], scopeDont: [] };
      if (typeof descriptionToSend === "object") {
        // Loại bỏ các trường rỗng
        const cleaned = {};
        if (descriptionToSend.what) cleaned.what = descriptionToSend.what;
        if (descriptionToSend.purpose) cleaned.purpose = descriptionToSend.purpose;
        if (Array.isArray(descriptionToSend.scopeDo) && descriptionToSend.scopeDo.length > 0) cleaned.scopeDo = descriptionToSend.scopeDo;
        if (Array.isArray(descriptionToSend.scopeDont) && descriptionToSend.scopeDont.length > 0) cleaned.scopeDont = descriptionToSend.scopeDont;
        descriptionToSend = Object.keys(cleaned).length > 0 ? cleaned : "";
      }

      const updated = await taskApi.update(task.id, {
        title: editPayload.title.trim(),
        description: descriptionToSend,
        dueDate: editPayload.dueDate || "",
        priority: editPayload.priority || "medium",
      });
      toast.success("Đã cập nhật task.");
      setShowEdit(false);
      if (onTaskUpdated) onTaskUpdated(updated);
    } catch (e) {
      toast.error(e?.message || "Không cập nhật được.");
    } finally {
      setSaving(false);
    }
  };

  if (inline) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-0 relative">
        {inner}
        {showEdit && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Sửa task</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề</label>
                <input value={editPayload.title || ""} onChange={(e) => setEditPayload((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">M�� tả (Task này làm gì)</label>
                <textarea value={typeof editPayload.description === "object" ? editPayload.description?.what || "" : editPayload.description || ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), what: e.target.value } }))} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Task này làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mục đích/Bối cảnh</label>
                <textarea value={typeof editPayload.description === "object" ? editPayload.description?.purpose || "" : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), purpose: e.target.value } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Mục đích..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi sẽ làm (mỗi dòng 1 mục)</label>
                <textarea value={typeof editPayload.description === "object" ? (editPayload.description?.scopeDo || []).join("\n") : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), scopeDo: e.target.value.split("\n").filter(Boolean) } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Sẽ làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi KHÔNG làm (mỗi dòng 1 mục)</label>
                <textarea value={typeof editPayload.description === "object" ? (editPayload.description?.scopeDont || []).join("\n") : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), scopeDont: e.target.value.split("\n").filter(Boolean) } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Không làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hạn</label>
                <input value={editPayload.dueDate || ""} onChange={(e) => setEditPayload((p) => ({ ...p, dueDate: e.target.value }))} placeholder="VD: 2024-12-31" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ưu tiên</label>
                <select value={editPayload.priority || "medium"} onChange={(e) => setEditPayload((p) => ({ ...p, priority: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium disabled:opacity-50">Lưu</button>
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {inner}
        {showEdit && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Sửa task</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề</label>
                <input value={editPayload.title || ""} onChange={(e) => setEditPayload((p) => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả (Task này làm gì)</label>
                <textarea value={typeof editPayload.description === "object" ? editPayload.description?.what || "" : editPayload.description || ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), what: e.target.value } }))} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Task này làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mục đích/Bối cảnh</label>
                <textarea value={typeof editPayload.description === "object" ? editPayload.description?.purpose || "" : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), purpose: e.target.value } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Mục đích..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi sẽ làm (mỗi dòng 1 mục)</label>
                <textarea value={typeof editPayload.description === "object" ? (editPayload.description?.scopeDo || []).join("\n") : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), scopeDo: e.target.value.split("\n").filter(Boolean) } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Sẽ làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phạm vi KHÔNG làm (mỗi dòng 1 mục)</label>
                <textarea value={typeof editPayload.description === "object" ? (editPayload.description?.scopeDont || []).join("\n") : ""} onChange={(e) => setEditPayload((p) => ({ ...p, description: { ...(typeof p.description === "object" ? p.description : { what: "", purpose: "", scopeDo: [], scopeDont: [] }), scopeDont: e.target.value.split("\n").filter(Boolean) } }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Không làm gì..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hạn</label>
                <input value={editPayload.dueDate || ""} onChange={(e) => setEditPayload((p) => ({ ...p, dueDate: e.target.value }))} placeholder="VD: 2024-12-31" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ưu tiên</label>
                <select value={editPayload.priority || "medium"} onChange={(e) => setEditPayload((p) => ({ ...p, priority: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-[#FA8DAE] text-white rounded-lg text-sm font-medium disabled:opacity-50">Lưu</button>
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Hủy</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
