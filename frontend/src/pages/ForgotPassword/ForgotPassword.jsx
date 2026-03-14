import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi";
import logo from "../../assets/logo-web.png";
import bgSocial from "../../assets/bglogin.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập email.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(trimmed);
      setDone(true);
      if (res?.resetToken) setResetToken(res.resetToken);
      toast.success(res?.message || "Kiểm tra email của bạn.");
    } catch (err) {
      toast.error(err?.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-cover bg-center filter blur-md" style={{ backgroundImage: `url(${bgSocial})` }} />
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <div className="container max-w-md mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-xl bg-white/90 backdrop-blur-md p-8">
            <img src={logo} alt="logo" className="w-[120px] mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Quên mật khẩu</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Nhập email đăng ký để nhận hướng dẫn đặt lại mật khẩu</p>

            {!done ? (
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full h-[50px] rounded-full px-4 border-2 border-gray-300 focus:border-[#FA8DAE] outline-none mb-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] rounded-full bg-[#FA8DAE] text-white font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Nếu email tồn tại, bạn sẽ nhận hướng dẫn đặt lại mật khẩu.</p>
                {resetToken && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
                    <strong>Demo:</strong> Dùng token này để đặt lại mật khẩu: <code className="break-all">{resetToken}</code>
                  </p>
                )}
                <Link to="/reset-password" className="block text-center text-[#FA8DAE] font-medium hover:underline">
                  Đến trang đặt lại mật khẩu
                </Link>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              <Link to="/login" className="text-[#FA8DAE] hover:underline">Quay lại đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
