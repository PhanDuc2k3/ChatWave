import React, { useState } from "react";

export default function HomeCreatePost({ onCreatePost }) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const trimmedImage = imageUrl.trim();

    if (!trimmedText && !trimmedImage) return;

    onCreatePost({
      text: trimmedText,
      imageUrl: trimmedImage || null,
    });

    setText("");
    setImageUrl("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm px-4 py-3 md:px-5 md:py-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FA8DAE]/20 flex items-center justify-center text-sm font-semibold text-[#FA8DAE]">
          U
        </div>

        <div className="flex-1 space-y-2">
          <textarea
            className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm md:text-base outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE] min-h-[60px]"
            placeholder="Bạn đang nghĩ gì?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <input
              type="url"
              className="w-full md:flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-xs md:text-sm outline-none focus:border-[#FA8DAE] focus:ring-1 focus:ring-[#FA8DAE]"
              placeholder="Link ảnh (tùy chọn)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />

            <button
              type="submit"
              className="self-end md:self-auto px-4 py-1.5 rounded-full bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] text-white text-xs md:text-sm font-semibold hover:opacity-90 transition"
            >
              Đăng tin
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

