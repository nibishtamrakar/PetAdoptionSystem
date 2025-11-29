import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const StaffProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  if (!user) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        <div className="flex items-center space-x-6">
          <Link to="/staff/dashboard" className="text-white font-semibold hover:text-blue-100">
            Home
          </Link>
          <Link to="/staff/dashboard?tab=history" className="text-white font-semibold hover:text-blue-100">
            History
          </Link>
          <Link to="/staff/dashboard?tab=requests" className="text-white font-semibold hover:text-blue-100">
            Requests
          </Link>
          <Link to="/staff/profile" className="text-white font-semibold hover:text-blue-100">
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
          >
            Logout
          </button>
        </div>
      </Navbar>

      <div className="pt-20 px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-600 mb-8">Profile</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm">Name</label>
                <p className="text-xl font-semibold">{user.name}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm">Email</label>
                <p className="text-xl font-semibold">{user.email}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm">Role</label>
                <p className="text-xl font-semibold">{user.role}</p>
              </div>
              <div>
                <label className="text-gray-600 text-sm">User ID</label>
                <p className="text-xl font-semibold">{user.userID}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfile;
