import React from "react";
import { useAuth } from "./context/AuthProvider";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    const res = await login();

    if (res.success) {
      navigate("/");
    }
  };

  return (
    <div
      className="w-full h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('./images/login-bg.jpg')" }}
    >
      <div className="w-96 p-8 bg-white/95 shadow-lg rounded-xl text-center font-sans">
        <img
          src="./images/iitg-logo.png"
          alt="IITG Logo"
          className="w-20 h-20 mx-auto mb-3"
        />

        <h2 className="text-black font-semibold text-xl mb-5 select-none">
          Industry Liaison, CCD IITG
        </h2>

        <button
          onClick={handleLogin}
          className="w-full py-3 text-base font-semibold text-white bg-[#003366] hover:bg-[#002244] rounded-md transition cursor-pointer"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
