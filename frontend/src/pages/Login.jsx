import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.detail || "Login failed");
        return;
      }

      // store user if you want
      // localStorage.setItem("user", JSON.stringify(data));

      navigate("/browsepets");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error");
    }
  };

  return (
    <>
      <div className="flex h-screen">
        <div className="w-[60%] bg-blue-300 flex flex-col align-middle justify-center pl-20 text-white">
          <div className="text-center">
            <h1 className="text-6xl font-extrabold mb-4">Welcome Back</h1>
            <p className="text-2xl">
              You can sign in to access your existing account.
            </p>
          </div>
        </div>

        <div className="w-[40%] bg-gray-100 flex flex-col justify-center items-center">
          <h2 className="text-5xl font-bold text-blue-400 mb-6">Sign In</h2>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <button
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 px-20 rounded-full shadow-lg text-lg transition-all duration-200"
            onClick={handleLogin}
          >
            Sign In
          </button>
        </div>
      </div>
    </>
  );
};

export default Login;
