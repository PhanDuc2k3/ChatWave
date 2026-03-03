import React, { useState } from "react";
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
} from "lucide-react";

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

export default function TaskDetail({ task, onUpdateStatus, onClose, inline = false }) {
  if (!task) return null;

  const StatusIcon = STATUS_ICONS[task.status];
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [completionComment, setCompletionComment] = useState("");
  const [submittedInfo, setSubmittedInfo] = useState(null);

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    setSubmissionFiles(files);
  };

  const handleSubmitCompletion = () => {
    const hasContent =
      submissionFiles.length > 0 || completionComment.trim().length > 0;
    if (!hasContent) return;

    if (onUpdateStatus && task.status !== "done") {
      onUpdateStatus(task.id, "done");
    }

    const timeLabel = new Date().toLocaleString();
    setSubmittedInfo({
      timeLabel,
      filesCount: submissionFiles.length,
      comment: completionComment.trim() || null,
    });
  };
  const hasDescription = task.description && (
    task.description.what ||
    task.description.purpose ||
    (task.description.scopeDo && task.description.scopeDo.length) ||
    (task.description.scopeDont && task.description.scopeDont.length)
  );
  const hasPeople = task.assignee || task.reviewer;
  const hasAcceptance = task.acceptanceCriteria && task.acceptanceCriteria.length > 0;
  const hasDeliverables = task.deliverables && task.deliverables.length > 0;
  const hasReferences = task.references && task.references.length > 0;
  const hasRisksNotes = task.risksNotes && task.risksNotes.trim();

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
          <h2 className="mt-2 text-lg font-bold text-gray-900">{task.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Giao bởi {task.assigner}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="shrink-0 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* 2. Mô tả chi tiết */}
          <Section title="Mô tả chi tiết" icon={FileText}>
            {hasDescription ? (
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

          {/* 8. Deliverables */}
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
                    submissionFiles.length === 0 &&
                    completionComment.trim().length === 0
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition ${
                    submissionFiles.length === 0 &&
                    completionComment.trim().length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#FA8DAE] text-white shadow-sm hover:bg-[#F9789E]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Gửi & đánh dấu đã xong
                </button>
              </div>

              {submittedInfo && (
                <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-1">
                  Đã lưu thông tin hoàn thành lúc{" "}
                  <span className="font-semibold">{submittedInfo.timeLabel}</span>
                  {submittedInfo.filesCount > 0 && (
                    <>
                      {" "}
                      · {submittedInfo.filesCount} file
                    </>
                  )}
                  {submittedInfo.comment && (
                    <>
                      {" "}
                      · Comment: <span className="italic">{submittedInfo.comment}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </Section>

          {/* 12. Trạng thái task */}
          <Section title="Trạng thái task" icon={ClipboardList}>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Luồng trạng thái: <span className="font-medium">Chờ làm → Đang làm → Đã xong</span>.
              </p>

              {task.status === "pending" && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 max-w-[60%]">
                    Hiện tại task đang ở trạng thái{" "}
                    <span className="font-medium text-amber-700">Chờ làm</span>.
                    Bấm nút bên phải khi bạn xác nhận và bắt đầu làm task này.
                  </p>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus?.(task.id, "in_progress")}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                  >
                    <Loader2 className="w-4 h-4" />
                    Bắt đầu làm
                  </button>
                </div>
              )}

              {task.status === "in_progress" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Bạn đang <span className="font-semibold">Đang làm</span> task này. Khi hoàn thành,
                  hãy dùng mục <span className="font-semibold">Gửi file & comment khi hoàn thành</span>{" "}
                  phía trên để submit, hệ thống sẽ tự chuyển sang trạng thái{" "}
                  <span className="font-semibold">Đã xong</span>.
                </p>
              )}

              {task.status === "done" && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  Task đã ở trạng thái <span className="font-semibold">Đã xong</span>. Bạn vẫn có thể
                  xem lại file bàn giao và comment ở phía trên nếu cần.
                </p>
              )}
            </div>
          </Section>
        </div>
    </>
  );

  if (inline) {
    return (
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-0">
        {inner}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {inner}
      </div>
    </>
  );
}
