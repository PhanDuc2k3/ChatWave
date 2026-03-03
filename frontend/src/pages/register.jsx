import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import login from "../assets/login.png";
import logo from "../assets/logo-web.jpg";
import bgSocial from "../assets/bglogin.png";
import { authApi } from "../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegisterClick = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      toast.success("Đăng ký thành công! Hãy đăng nhập để tiếp tục.");
      navigate("/login");
    } catch (err) {
      const message = err?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-md"
        style={{ backgroundImage: `url(${bgSocial})` }}
      />

      {/* Centered Form - same style as login (no movement) */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <form className="container max-w-6xl mx-auto" onSubmit={handleRegisterClick}>
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-[25px] overflow-hidden shadow-xl bg-white/80 backdrop-blur-md border-[6px] border-white">
            {/* LEFT IMAGE */}
            <div className="hidden md:block">
              <img
                src={login}
                alt="register"
                className="w-full h-full object-cover"
              />
            </div>

            {/* RIGHT FORM */}
            <div className="bg-white relative p-10 flex flex-col items-center">
              <img
                src={logo}
                alt="logo"
                className="w-[150px] absolute top-5 right-5"
              />

              <div className="mt-24 w-full text-center">
                <h1 className="text-4xl font-bold bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent mb-3">
                  Tạo tài khoản ChatWave
                </h1>

                <p className="text-gray-500 mb-8">
                  Đăng ký tài khoản mới để bắt đầu kết nối cùng mọi người.
                </p>

                {/* USERNAME */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Tên đăng nhập"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* EMAIL */}
                <div className="relative mb-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* PHONE */}
                <div className="relative mb-4">
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* PASSWORD */}
                <div className="relative mb-4">
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <i className="fas fa-eye absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="relative mb-4">
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <i className="fas fa-eye absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
                </div>

                {/* REGISTER BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[60px] rounded-full text-white text-lg font-semibold bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] hover:bg-linear-to-l transition mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang đăng ký..." : "Đăng ký"}
                </button>

                {/* LOGIN LINK */}
                <div className="mt-6 text-lg">
                  Bạn đã có tài khoản?
                  <Link
                    to="/login"
                    className="ml-2 bg-transparent border-none cursor-pointer p-0"
                  >
                    <span className="bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent font-semibold">
                      Đăng nhập
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full py-3 text-center text-xs text-gray-500">
        made by MDuc
      </div>
    </div>
  );
}