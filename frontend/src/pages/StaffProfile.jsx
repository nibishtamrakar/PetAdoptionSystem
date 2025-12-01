import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const StaffProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // auth guard + load staff user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px" }}>Loading staff profile...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="staff-profile-page" style={{ padding: "20px" }}>
        <div
          className="staff-profile-header"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <h1>Staff Profile</h1>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>

        <div className="staff-profile-card" style={{ marginTop: "20px" }}>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Role:</strong> {user.role}
          </p>
          <p>
            <strong>User ID:</strong> {user.userID}
          </p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <Link to="/staff/dashboard" className="btn btn-primary">
            Go to Staff Dashboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default StaffProfile;
