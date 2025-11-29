import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adoptions, setAdoptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editingAppointmentData, setEditingAppointmentData] = useState({});
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  // ========== FETCH PROFILE DATA ==========
  const fetchProfileData = async (userData) => {
    if (!userData) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const profileRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}`,
        { credentials: "include" }
      );
      if (!profileRes.ok) throw new Error("Failed to load profile");
      const profileData = await profileRes.json();
      setUser(profileData);
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });

      // Fetch adoptions
      const adoptionsRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}/adoptions`,
        { credentials: "include" }
      );
      if (!adoptionsRes.ok) throw new Error("Failed to load adoptions");
      const adoptionsData = await adoptionsRes.json();
      setAdoptions(adoptionsData || []);

      // Fetch appointments
      const appointmentsRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}/appointments`,
        { credentials: "include" }
      );
      if (!appointmentsRes.ok) throw new Error("Failed to load appointments");
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData || []);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // ========== AUTH GUARD + INITIAL LOAD ==========
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      // Call fetch with parsed user
      fetchProfileData(parsed);
    } catch {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // ========== AUTO-RELOAD DATA WHEN RETURNING TO PAGE ==========
  useEffect(() => {
    const handleFocus = () => {
      console.log("Page regained focus - refreshing data");
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          fetchProfileData(parsed);
        } catch (err) {
          console.error("Error refreshing data on focus:", err);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // ========== HANDLE LOGOUT ==========
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/homepage", { replace: true });
  };

  // ========== HANDLE EDIT PROFILE ==========
  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUpdateError(null);
    setUpdateSuccess(null);
    // Reset form to current user data
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setUpdateError(null);
      setUpdateSuccess(null);

      const res = await fetch(`${API_BASE_URL}/api/users/${user.userID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to update profile");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUpdateSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Refresh all data after save
      fetchProfileData(updatedUser);

      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError(err.message || "Failed to update profile");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ========== HANDLE APPOINTMENT EDIT ==========
  const handleEditAppointment = (appointment) => {
    setEditingAppointmentId(appointment.appointmentID);
    setEditingAppointmentData({
      appointmentTime: appointment.appointmentTime,
    });
  };

  const handleSaveAppointment = async () => {
    if (!editingAppointmentId || !user) return;
    try {
      // TODO: Backend endpoint needed - PUT /api/appointments/{appointmentID}
      // For now, just update UI and show success
      setEditingAppointmentId(null);
      
      // Update appointment in local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.appointmentID === editingAppointmentId
            ? { ...apt, appointmentTime: editingAppointmentData.appointmentTime }
            : apt
        )
      );
      
      setUpdateSuccess("Appointment updated successfully!");
      
      // Refresh all data after save
      setTimeout(() => {
        fetchProfileData(user);
        setUpdateSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Error updating appointment:", err);
      setUpdateError("Failed to update appointment");
    }
  };

  const handleCancelEditAppointment = () => {
    setEditingAppointmentId(null);
    setEditingAppointmentData({});
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen pt-20">
          <p className="text-xl">Loading profile...</p>
        </div>
      </>
    );
  }

  if (error && !user) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center h-screen pt-20">
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-blue-100 min-h-screen flex flex-col pt-20">
        {/* Content wrapper - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Account Info Section */}
          <div className="mb-6">
            {updateSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">
                {updateSuccess}
              </div>
            )}

            {updateError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                {updateError}
              </div>
            )}

            {isEditing ? (
              // Edit Mode
              <div className="space-y-3 w-1/2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-500 text-white rounded-full font-semibold text-sm hover:bg-green-600 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-400 text-white rounded-full font-semibold text-sm hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {user?.name}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {user?.phone || "N/A"}
                </p>
                <p>
                  <strong>Role:</strong> {user?.role}
                </p>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="mt-3 px-5 py-2 bg-blue-400 text-white rounded-full font-semibold text-sm hover:bg-blue-500 transition"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Toggle Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition ${
                activeTab === "applications"
                  ? "bg-blue-400 text-white hover:bg-blue-500"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-6 py-2 rounded-full font-semibold text-sm transition ${
                activeTab === "appointments"
                  ? "bg-blue-400 text-white hover:bg-blue-500"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              Appointments
            </button>
          </div>

          {/* Applications Section */}
          {activeTab === "applications" && (
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Recent Adoption Applications
                </h2>
                <button 
                  onClick={() => setShowNewApplicationModal(true)}
                  className="text-blue-400 hover:text-blue-600 text-4xl font-bold leading-none transition h-10 w-10 flex items-center justify-center"
                  title="Add new application"
                  aria-label="Add new application"
                >
                  +
                </button>
              </div>

              {adoptions.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No adoption applications yet. Start browsing pets!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                          Pet
                        </th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                          Submitted
                        </th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {adoptions.map((adoption) => (
                        <tr
                          key={adoption.adoptionID}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="py-2 px-3">
                            {adoption.petName} ({adoption.petSpecies})
                          </td>
                          <td className="py-2 px-3">
                            {new Date(
                              adoption.applicationDate
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-3 py-1 rounded-full font-semibold text-xs ${
                                adoption.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : adoption.status === "APPLIED"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : adoption.status === "FINALIZED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {adoption.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Appointments Section */}
          {activeTab === "appointments" && (
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Upcoming Appointments
                </h2>
                <button 
                  onClick={() => setShowNewAppointmentModal(true)}
                  className="text-blue-400 hover:text-blue-600 text-4xl font-bold leading-none transition h-10 w-10 flex items-center justify-center"
                  title="Schedule new appointment"
                  aria-label="Schedule new appointment"
                >
                  +
                </button>
              </div>

              {appointments.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No appointments scheduled. Schedule one to meet your future pet!
                </p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.appointmentID}
                      className="border border-gray-300 rounded-lg p-3 hover:bg-gray-50 flex justify-between items-start"
                    >
                      <div className="flex-1">
                        {editingAppointmentId === appointment.appointmentID ? (
                          // Edit Mode
                          <div className="space-y-2">
                            <p className="font-semibold text-gray-800 text-sm">
                              {appointment.petName} ({appointment.petSpecies})
                            </p>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={
                                  editingAppointmentData.appointmentTime
                                    ? new Date(editingAppointmentData.appointmentTime)
                                        .toISOString()
                                        .slice(0, 16)
                                    : ""
                                }
                                onChange={(e) =>
                                  setEditingAppointmentData({
                                    appointmentTime: new Date(e.target.value),
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveAppointment}
                                className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditAppointment}
                                className="px-3 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <p className="font-semibold text-gray-800 text-sm">
                              {appointment.petName} ({appointment.petSpecies})
                            </p>
                            <p className="text-gray-600 text-xs">
                              <span className="font-semibold">Type:</span>{" "}
                              {appointment.appointmentType}
                            </p>
                            <p className="text-gray-600 text-xs">
                              <span className="font-semibold">Time:</span>{" "}
                              {new Date(appointment.appointmentTime).toLocaleString()}
                            </p>
                            <p className="text-gray-600 text-xs">
                              <span className="font-semibold">Shelter:</span>{" "}
                              {appointment.shelterName}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {appointment.shelterAddress}
                            </p>
                          </>
                        )}
                      </div>

                      {editingAppointmentId !== appointment.appointmentID && (
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="text-blue-400 hover:text-blue-500 font-semibold text-sm ml-4"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* End content wrapper */}
      </div>

      {/* NEW APPLICATION MODAL */}
      {showNewApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Create New Application
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pet Name
                </label>
                <input
                  type="text"
                  placeholder="Enter pet name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pet Species
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dog, Cat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewApplicationModal(false);
                    alert("Application submitted! (Backend integration needed)");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-400 text-white rounded-full font-semibold text-sm hover:bg-blue-500 transition"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowNewApplicationModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-full font-semibold text-sm hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW APPOINTMENT MODAL */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Schedule New Appointment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pet Name
                </label>
                <input
                  type="text"
                  placeholder="Enter pet name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shelter Name
                </label>
                <input
                  type="text"
                  placeholder="Enter shelter name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewAppointmentModal(false);
                    alert("Appointment scheduled! (Backend integration needed)");
                  }}
                  className="flex-1 px-4 py-2 bg-blue-400 text-white rounded-full font-semibold text-sm hover:bg-blue-500 transition"
                >
                  Schedule
                </button>
                <button
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-full font-semibold text-sm hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
