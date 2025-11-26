import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.detail || "Login failed");
        return;
      }

      // localStorage.setItem("user", JSON.stringify(data));
      navigate("/browsepets");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error");
    }
  };

  // ... JSX unchanged
};

export default Login;
