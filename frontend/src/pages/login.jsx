import { Link } from "react-router-dom";
import login from "../assets/login.png";
import logo from "../assets/logo-web.png";

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('../../assets/bglogin.png')" }}
    >
      <form className="container max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-[25px] overflow-hidden shadow-lg">
          
          {/* LEFT */}
          <div className="hidden md:block">
            <img
              src={login}
              alt="login"
              className="w-full h-full object-cover"
            />
          </div>

          {/* RIGHT */}
          <div className="bg-white relative p-10 flex flex-col items-center">
            <img
              src={logo}
              alt="logo"
              className="w-[200px] absolute top-5 right-5"
            />

            <div className="mt-40 w-full text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent mb-4">
                ChatWave
              </h1>

              <p className="text-gray-500 mb-10">
                Đăng nhập bằng tài khoản ChatWave
              </p>

              {/* EMAIL */}
              <div className="relative mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                />
              </div>

              {/* PASSWORD */}
              <div className="relative mb-6">
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                />
                <i className="fas fa-eye absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                className="w-full h-[60px] rounded-full text-white text-lg font-semibold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] hover:bg-gradient-to-l transition"
              >
                Đăng nhập
              </button>

              {/* REGISTER */}
              <div className="mt-12 text-lg">
                Bạn chưa có tài khoản?
                <Link to="/register" className="ml-2">
                  <span className="bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent font-semibold">
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