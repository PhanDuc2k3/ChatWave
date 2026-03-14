import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi";
import logo from "../../assets/logo-web.png";
import bgSocial from "../../assets/bglogin.png";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      toast.error("Vui lòng nhập token đặt lại mật khẩu.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới ít nhất 6 ký tự.");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      toast.error("Mật khẩu cần có ít nhất 1 chữ cái.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Mật khẩu cần có ít nhất 1 chữ số.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), newPassword);
      setDone(true);
      toast.success("Đặt lại mật khẩu thành công!");
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
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Đặt lại mật khẩu</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Nhập token và mật khẩu mới</p>

            {!done ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Token (từ email hoặc trang quên mật khẩu)"
                  className="w-full h-[50px] rounded-full px-4 border-2 border-gray-300 focus:border-[#FA8DAE] outline-none"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Mật khẩu mới"
                  className="w-full h-[50px] rounded-full px-4 border-2 border-gray-300 focus:border-[#FA8DAE] outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <input
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full h-[50px] rounded-full px-4 border-2 border-gray-300 focus:border-[#FA8DAE] outline-none"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] rounded-full bg-[#FA8DAE] text-white font-semibold hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-600">
                Đặt lại mật khẩu thành công. <Link to="/login" className="text-[#FA8DAE] font-medium hover:underline">Đăng nhập</Link>
              </p>
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
