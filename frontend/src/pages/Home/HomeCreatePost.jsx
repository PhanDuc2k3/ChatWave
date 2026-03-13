import React, { useMemo, useState, useRef } from "react";
import { Image, Smile, BarChart2, CalendarClock, X } from "lucide-react";
import toast from "react-hot-toast";
import { uploadApi } from "../../api/uploadApi";

export default function HomeCreatePost({ onCreatePost }) {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeTool, setActiveTool] = useState(null); // "image" | "feeling" | "poll" | "schedule" | null
  const [feeling, setFeeling] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [scheduledAt, setScheduledAt] = useState("");

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("chatwave_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);
  const currentInitial = currentUser?.username || currentUser?.email || currentUser?.name
    ? String(currentUser.username || currentUser.email || currentUser.name).charAt(0).toUpperCase()
    : "U";

  const scheduledLabel = useMemo(() => {
    if (!scheduledAt) return "";
    try {
      const [datePart, timePart] = scheduledAt.split("T");
      if (!datePart || !timePart) return "";
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      // Đây là giờ GMT+7 mà người dùng thấy/chọn
      const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = d.getUTCFullYear();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mi = String(d.getUTCMinutes()).padStart(2, "0");
      return `Bài viết này sẽ được đăng lúc ${hh}:${mi} ngày ${dd}/${mm}/${yyyy} (GMT+7).`;
    } catch {
      return "";
    }
  }, [scheduledAt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const hasText = !!trimmedText;
    const hasImage = !!imageFile;
    const hasPoll = !!pollQuestion.trim();
    const hasFeeling = !!feeling;
    // Cần ít nhất một trong 4: nội dung, ảnh, khảo sát hoặc cảm xúc
    if (!hasText && !hasImage && !hasPoll && !hasFeeling) return;

    let imageUrl = null;
    if (imageFile) {
      try {
        setUploading(true);
        const data = await uploadApi.uploadImage(imageFile);
        imageUrl = data?.url || null;
        if (!imageUrl) toast.error("Tải ảnh lên thất bại.");
      } catch (err) {
        toast.error(err?.message || "Tải ảnh lên thất bại.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const cleanedOptions = pollOptions
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    let scheduledAtToSend = null;
    if (scheduledAt) {
      try {
        const [datePart, timePart] = scheduledAt.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute] = timePart.split(":").map(Number);
        // Diễn giải thời gian trong picker là GMT+7, chuyển sang UTC để backend lưu chuẩn
        const utcDate = new Date(
          Date.UTC(year, month - 1, day, hour - 7, minute)
        );
        scheduledAtToSend = utcDate.toISOString();
      } catch {
        scheduledAtToSend = null;
      }
    }

    onCreatePost({
      text: trimmedText || "",
      imageUrl: imageUrl || null,
      feeling: feeling || null,
      poll:
        pollQuestion.trim() && cleanedOptions.length >= 2
          ? {
              question: pollQuestion.trim(),
              options: cleanedOptions.map((t) => ({ text: t })),
            }
          : null,
      scheduledAt: scheduledAtToSend,
    });

    setText("");
    setImageFile(null);
    setImagePreview(null);
    setFeeling("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setScheduledAt("");
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB.");
      return;
    }
    // Chọn ảnh => chỉ dùng chức năng ảnh, reset các tool khác
    setActiveTool("image");
    setFeeling("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setScheduledAt("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    fileInputRef.current && (fileInputRef.current.value = "");
    if (activeTool === "image") {
      setActiveTool(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white rounded-2xl shadow-sm border border-[#E2E8F0] px-4 py-3 md:px-5 md:py-4 mb-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#4F8EF7] flex items-center justify-center text-lg font-semibold text-white shrink-0">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            currentInitial
          )}
        </div>

        <div className="flex-1 space-y-3">
          <textarea
            className="w-full resize-none border border-[#E2E8F0] rounded-2xl px-4 py-3 text-sm md:text-base outline-none focus:border-[#4F8EF7] focus:ring-1 focus:ring-[#4F8EF7] min-h-[72px] bg-[#F8FAFC]"
            placeholder="Hôm nay bạn đang nghĩ gì?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-row items-center justify-between gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => {
                    // Chuyển sang chế độ ảnh: reset các tool khác
                    setActiveTool("image");
                    setFeeling("");
                    setPollQuestion("");
                    setPollOptions(["", ""]);
                    setScheduledAt("");
                    fileInputRef.current?.click();
                  }}
                  disabled={uploading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition disabled:opacity-50 ${
                    activeTool === "image" ? "bg-[#F1F5F9]" : "hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Image className="w-5 h-5 text-[#F97316]" />
                  <span className="hidden sm:inline">Ảnh/Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Chỉ bật cảm xúc, tắt ảnh / poll / lịch
                    setActiveTool(activeTool === "feeling" ? null : "feeling");
                    setImageFile(null);
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                    fileInputRef.current && (fileInputRef.current.value = "");
                    setPollQuestion("");
                    setPollOptions(["", ""]);
                    setScheduledAt("");
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
                    activeTool === "feeling" ? "bg-[#F1F5F9]" : "hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Smile className="w-5 h-5 text-[#F97316]" />
                  <span className="hidden sm:inline">
                    {feeling ? `Cảm xúc: ${feeling}` : "Cảm xúc"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextActive = activeTool === "poll" ? null : "poll";
                    setActiveTool(nextActive);
                    if (nextActive === "poll" && !pollQuestion) {
                      setPollQuestion("Khảo sát mới");
                    }
                    // Khi bật poll thì tắt ảnh / cảm xúc / lịch
                    if (nextActive === "poll") {
                      setFeeling("");
                      setImageFile(null);
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImagePreview(null);
                      fileInputRef.current && (fileInputRef.current.value = "");
                      setScheduledAt("");
                    }
                  }}
                  className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
                    activeTool === "poll" ? "bg-[#F1F5F9]" : "hover:bg-[#F1F5F9]"
                  }`}
                >
                  <BarChart2 className="w-5 h-5 text-[#22C55E]" />
                  <span>Khảo sát</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextActive =
                      activeTool === "schedule" ? null : "schedule";
                    setActiveTool(nextActive);
                    if (nextActive === "schedule" && !scheduledAt) {
                      const now = new Date();
                      // Lấy thời điểm hiện tại theo UTC rồi cộng thêm 7 giờ (GMT+7) và 10 phút
                      const gmt7Plus10 = new Date(
                        now.getTime() + 7 * 60 * 60 * 1000 + 10 * 60 * 1000
                      );
                      const year = gmt7Plus10.getUTCFullYear();
                      const month = String(
                        gmt7Plus10.getUTCMonth() + 1
                      ).padStart(2, "0");
                      const day = String(
                        gmt7Plus10.getUTCDate()
                      ).padStart(2, "0");
                      const hours = String(
                        gmt7Plus10.getUTCHours()
                      ).padStart(2, "0");
                      const minutes = String(
                        gmt7Plus10.getUTCMinutes()
                      ).padStart(2, "0");
                      const iso = `${year}-${month}-${day}T${hours}:${minutes}`;
                      setScheduledAt(iso);
                    }
                    if (nextActive === "schedule") {
                      // Tắt ảnh / cảm xúc / poll
                      setFeeling("");
                      setImageFile(null);
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setImagePreview(null);
                      fileInputRef.current && (fileInputRef.current.value = "");
                      setPollQuestion("");
                      setPollOptions(["", ""]);
                    }
                  }}
                  className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
                    activeTool === "schedule"
                      ? "bg-[#F1F5F9]"
                      : "hover:bg-[#F1F5F9]"
                  }`}
                >
                  <CalendarClock className="w-5 h-5 text-[#EAB308]" />
                  <span>Lên lịch</span>
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 text-xs transition"
                  >
                    <X className="w-3 h-3" />
                    Xóa ảnh
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-1.5 rounded-full bg-[#F97316] text-white text-xs md:text-sm font-semibold shadow-sm hover:bg-[#EA580C] transition disabled:opacity-50 shrink-0"
              >
                {uploading ? "Đang đăng..." : "Đăng"}
              </button>
            </div>
          </div>

          {imagePreview && (
            <div className="relative inline-block rounded-xl overflow-hidden border border-gray-200 mt-1 max-w-xs">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 object-cover block"
              />
              <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
                Xem trước
              </span>
            </div>
          )}

          {/* Cảm xúc đơn giản */}
          {activeTool === "feeling" && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              {["😊 Vui", "😢 Buồn", "😎 Tuyệt vời", "😴 Mệt mỏi"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling((prev) => (prev === f ? "" : f))}
                  className={`px-2 py-1 rounded-full border ${
                    feeling === f
                      ? "bg-[#FA8DAE]/10 border-[#FA8DAE] text-[#BE185D]"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* Khảo sát */}
          {activeTool === "poll" && pollQuestion && (
            <div className="mt-2 border border-dashed border-gray-300 rounded-2xl p-3 space-y-2">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full text-xs md:text-sm border-b border-gray-200 pb-1 outline-none"
                placeholder="Câu hỏi khảo sát"
              />
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  className="w-full text-xs md:text-sm border border-gray-200 rounded-full px-3 py-1 outline-none mt-1"
                  placeholder={`Lựa chọn ${idx + 1}`}
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                  className="text-xs text-[#FA8DAE] hover:underline mt-1"
                >
                  + Thêm lựa chọn
                </button>
              )}
            </div>
          )}

          {/* Lên lịch đăng */}
          {activeTool === "schedule" && scheduledAt && (
            <div className="mt-2 flex flex-col items-start gap-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Đăng lúc:</span>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => setScheduledAt("")}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Hủy
                </button>
              </div>
              {scheduledLabel && (
                <p className="text-[11px] text-gray-500">
                  {scheduledLabel}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

