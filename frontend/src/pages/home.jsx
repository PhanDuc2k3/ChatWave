import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import anh1 from "../assets/anh1.jpg";
import anh2 from "../assets/anh2.jpg";
import anh3 from "../assets/anh3.jpg";
import anh4 from "../assets/anh4.png";
import anh5 from "../assets/anh5.jpg";

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  // Thay đường dẫn image bằng ảnh thật của bạn (public folder hoặc URL)
  const slides = [
    {
      id: 1,
      image: anh1,
      title: "Chào mừng đến với CHATWAVE!",
      subtitle:
        "Khám phá không gian hỗ trợ làm việc và trò chuyện cùng người thân, bạn bè và đối tác ngay trên máy tính của bạn.",
    },
    {
      id: 2,
      image: anh2,
      title: "Gửi file nóng trong chớp mắt",
      subtitle: "Kéo thả file, ChatWave lo phần còn lại cho bạn.",
    },
    {
      id: 3,
      image: anh3,
      title: "Lưu trữ an toàn",
      subtitle: "Tất cả tài liệu được sắp xếp gọn gàng, dễ tìm kiếm.",
    },
    {
      id: 4,
      image: anh4,
      title: "Làm việc nhóm hiệu quả",
      subtitle: "Trao đổi, chia sẻ, cập nhật tiến độ theo thời gian thực.",
    },
    {
      id: 5,
      image: anh5,
      title: "Tùy biến trải nghiệm",
      subtitle: "Giao diện thân thiện, hỗ trợ đa nền tảng.",
    },
  ];

  return (
    <MainLayout>
      <div className="w-full flex flex-col items-center">
        {/* Slider viewport: 80% chiều rộng content */}
        <div
          className="relative overflow-hidden"
          style={{ width: "80%" }}
        >
          {/* Track */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="w-full flex-shrink-0 px-6 py-10 flex flex-col items-center text-center"
              >
                {/* Ảnh slide */}
                {slide.image && (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="mb-6 w-40 h-32 rounded-3xl object-cover"
                  />
                )}

                {/* Nội dung */}
                <h1 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                  {slide.title}
                </h1>
                <p className="text-gray-500 text-sm md:text-base mb-4 max-w-xl">
                  {slide.subtitle}
                </p>

                <p className="text-[#F5A623] font-medium mb-1">
                  Gửi file nóng?
                </p>
                <p className="text-gray-500 text-sm">
                  Để cả ChatWave "xử" hết.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation dots 1–5 (no numbers) */}
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlide(index)}
              aria-label={`Chuyển đến slide ${index + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                activeSlide === index
                  ? "bg-[#F5C46A]"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

