import { Link } from "react-router-dom";
import login from "../assets/login.png";
import logo from "../assets/logo-web.jpg";

export default function Register() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bglogin.png')" }}
    >
      <form className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-[25px] overflow-hidden shadow-xl">
          
          {/* LEFT */}
          <div className="hidden md:block">
            <img
              src={login}
              alt="register"
              className="w-full h-full object-cover"
            />
          </div>

          {/* RIGHT */}
          <div className="bg-white relative p-10 flex flex-col items-center">
            <img
              src={logo}
              alt="logo"
              className="w-[150px] absolute top-5 right-5"
            />

            <div className="mt-32 w-full text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent mb-3">
                ChatWave
              </h1>

              <p className="text-gray-500 mb-8">
                Đăng ký tài khoản ChatWave của bạn
              </p>

              {/* INPUTS */}
              {[
                "Tên đăng nhập",
                "Email",
                "Số điện thoại",
                "Mật khẩu",
                "Nhập lại mật khẩu",
              ].map((label, index) => (
                <div key={index} className="relative mb-4">
                  <input
                    type={
                      label.toLowerCase().includes("mật")
                        ? "password"
                        : "text"
                    }
                    placeholder={label}
                    className="w-full h-[55px] rounded-full px-10 border-2 border-gray-400 focus:border-[#F5C46A] outline-none"
                  />
                  {label.toLowerCase().includes("mật") && (
                    <i className="fas fa-eye absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" />
                  )}
                </div>
              ))}

              {/* BUTTON */}
              <button
                type="submit"
                className="w-full h-[60px] rounded-full text-white text-lg font-semibold bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] hover:bg-gradient-to-l transition mt-4"
              >
                Đăng ký
              </button>

              {/* LOGIN LINK */}
              <div className="mt-6 text-lg">
                Bạn đã có tài khoản?
                <Link to="/login" className="ml-2">
                  <span className="bg-gradient-to-r from-[#F5C46A] to-[#FA8DAE] bg-clip-text text-transparent font-semibold">
                    Đăng nhập
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