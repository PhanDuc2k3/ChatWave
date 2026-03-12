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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    // Chỉ cần có ảnh HOẶC text (không bắt buộc cả hai)
    if (!trimmedText && !imageFile) return;

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

    onCreatePost({
      text: trimmedText || "",
      imageUrl: imageUrl || null,
    });

    setText("");
    setImageFile(null);
    setImagePreview(null);
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    fileInputRef.current && (fileInputRef.current.value = "");
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
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F1F5F9] transition disabled:opacity-50"
                >
                  <Image className="w-5 h-5 text-[#F97316]" />
                  <span className="hidden sm:inline">Ảnh/Video</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F1F5F9] transition"
                >
                  <Smile className="w-5 h-5 text-[#F97316]" />
                  <span className="hidden sm:inline">Cảm xúc</span>
                </button>
                <button
                  type="button"
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F1F5F9] transition"
                >
                  <BarChart2 className="w-5 h-5 text-[#22C55E]" />
                  <span>Khảo sát</span>
                </button>
                <button
                  type="button"
                  className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#F1F5F9] transition"
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
        </div>
      </div>
    </form>
  );
}

