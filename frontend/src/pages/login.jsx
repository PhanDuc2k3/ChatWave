import React from "react";
import { Link } from "react-router-dom";
import login from "../assets/login.png";
import logo from "../assets/logo-web.png";

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('../../assets/bglogin.png')" }}
    >
      <form className="w-full max-w-5xl px-4">
        <div className="relative rounded-[25px] shadow-lg bg-white/80 backdrop-blur-md overflow-hidden flex flex-col md:flex-row">
          {/* LEFT BACKGROUND IMAGE (BLURRED) */}
          <div className="w-full md:w-[45%] h-40 md:h-auto relative overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
              style={{ backgroundImage: `url(${login})` }}
            />
            <div className="absolute inset-0 bg-white/30" />
          </div>

          {/* RIGHT FORM */}
          <div className="w-full md:w-[55%] bg-white py-10 px-8 md:px-12 relative">
            <img
              src={logo}
              alt="logo"
              className="w-[200px] rounded-[25px] absolute top-5 right-5"
            />

            <div className="mt-24 md:mt-40 text-center md:text-center md:mr-16">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent -mt-24 md:-mt-32">
                ChatWave
              </h1>
              <span className="block text-[#626262] mb-10">
                Đăng nhập bằng tài khoản Chatwave
              </span>

              {/* EMAIL */}
              <div className="relative mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full h-[50px] rounded-full border-2 border-[#939090] px-10 py-2 outline-none focus:border-[#F5C46A] transition"
                />
              </div>

              {/* PASSWORD */}
              <div className="relative mb-6">
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  className="w-full h-[50px] rounded-full border-2 border-[#939090] px-10 py-2 outline-none focus:border-[#F5C46A] transition"
                />
                <i className="fas fa-eye absolute right-4 top-1/2 -translate-y-1/2 text-[#939090]" />
              </div>

              <button
                className="w-full h-[60px] rounded-full bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] text-white text-lg font-semibold mt-4 hover:bg-gradient-to-l transition"
                type="submit"
              >
                Đăng nhập
              </button>

              <div className="text-[20px] mt-12">
                Bạn chưa có tài khoản?
                <Link to="/register" className="ml-1 no-underline">
                  <span className="bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent">
                    Đăng ký
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}