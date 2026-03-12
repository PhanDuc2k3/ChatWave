import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/logo-web.png";
import login from "../assets/login.png";
import bgSocial from "../assets/bglogin.png";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      toast.error("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.login({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (data?.token) {
        localStorage.setItem("chatwave_token", data.token);

        // Gọi API profile bằng id user để lấy thông tin mới nhất
        const profile =
          data.user?.id || data.user?._id
            ? await userApi.getById(data.user.id || data.user._id)
            : data.user;

        localStorage.setItem(
          "chatwave_user",
          JSON.stringify(profile || data.user)
        );
      }

      toast.success("Đăng nhập thành công!");
      navigate("/");
    } catch (err) {
      const message = err?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
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

      {/* Centered Form (same style as register, no movement) */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <form className="container max-w-6xl mx-auto" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-[25px] overflow-hidden shadow-xl bg-white/80 backdrop-blur-md border-[6px] border-white">
            {/* LEFT IMAGE */}
            <div className="hidden md:block">
              <img
                src={login}
                alt="login"
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
                  Chào mừng bạn trở lại
                </h1>

                <p className="text-gray-500 mb-8">
                  Đăng nhập bằng tài khoản ChatWave của bạn
                </p>

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

                {/* PASSWORD */}
                <div className="relative mb-2">
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <i className="fas fa-eye absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
                </div>
                <div className="mb-4 text-right">
                  <Link to="/forgot-password" className="text-sm text-[#FA8DAE] hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[60px] rounded-full text-white text-lg font-semibold bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] hover:bg-linear-to-l transition mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>

                {/* REGISTER LINK */}
                <div className="mt-6 text-lg">
                  Bạn chưa có tài khoản?
                  <Link
                    to="/register"
                    className="ml-2 bg-transparent border-none cursor-pointer p-0"
                  >
                    <span className="bg-linear-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent font-semibold">
                      Đăng ký
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