import React from "react";
import logo from "../assets/logo-web.png";

export default function Header() {
  return (
    <header className="h-16 md:h-20 bg-[#F9C96D] flex items-center justify-between pr-4">
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt="ChatWave logo"
          className="w-20 h-20 object-contain"
        />
        <span className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent">
          ChatWave
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm md:text-base">
        <button className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 hover:bg-white shadow-sm">
          <i className="fas fa-sliders-h text-gray-600" />
          <span>Cài đặt</span>
        </button>

        <div className="flex items-center gap-3 text-lg text-gray-700">
          <button className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white">
            <i className="fas fa-sun" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center hover:bg-white">
            <i className="fas fa-moon" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FA8DAE] flex items-center justify-center text-white font-semibold">
            U
          </div>
          <span className="font-medium text-gray-800 text-sm md:text-base">
            User
          </span>
        </div>
      </div>
    </header>
  );
}

