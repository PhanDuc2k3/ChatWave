import React from "react";

export default function HomeEmptyState({ slides, activeSlide, setActiveSlide }) {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative overflow-hidden" style={{ width: "80%" }}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="w-full shrink-0 px-6 py-10 flex flex-col items-center text-center"
            >
              {slide.image && (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="mb-6 w-40 h-32 rounded-3xl object-cover"
                />
              )}

              <h1 className="text-xl md:text-2xl font-semibold mb-2 text-gray-800">
                {slide.title}
              </h1>
              <p className="text-gray-500 text-sm md:text-base mb-4 max-w-xl">
                {slide.subtitle}
              </p>

              <p className="text-[#F5A623] font-medium mb-1">Gửi file nóng?</p>
              <p className="text-gray-500 text-sm">Để cả ChatWave "xử" hết.</p>
            </div>
          ))}
        </div>
      </div>

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
  );
}

