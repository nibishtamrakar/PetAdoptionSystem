import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [pets, setPets] = useState([]);
  const [approvedAdoptions, setApprovedAdoptions] = useState([]);

  // Adoption form with appointment fields
  const [newAdoptionForm, setNewAdoptionForm] = useState({
    petID: "",
    appointmentTime: "",
    appointmentType: "VISIT",
    appointmentNotes: "",
  });

  const [selectedAdoptionPet, setSelectedAdoptionPet] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(null);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // ========== FETCH PROFILE DATA ==========
  const fetchProfileData = useCallback(async (userData) => {
    if (!userData) return;
    try {
      setLoading(true);
      setError(null);

      // Profile
      const profileRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}`,
        {
          credentials: "include",
          headers,
        }
      );
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => null);
        console.error("Profile error payload:", err);
        throw new Error(
          err?.detail || `Failed to load profile (${profileRes.status})`
        );
      }
      const profileData = await profileRes.json();
      setUser(profileData);
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      });

      // Adoptions
      const adoptionsRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}/adoptions`,
        { credentials: "include", headers }
      );
      if (!adoptionsRes.ok) {
        const err = await adoptionsRes.json().catch(() => null);
        console.error("Adoptions error payload:", err);
        throw new Error(
          err?.detail || `Failed to load adoptions (${adoptionsRes.status})`
        );
      }
      const adoptionsData = await adoptionsRes.json();
      setAdoptions(adoptionsData || []);

      // Approved Adoptions
      const approvedAdoptionsRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}/approved-adoptions`,
        { credentials: "include", headers }
      );
      if (approvedAdoptionsRes.ok) {
        const approvedAdoptionsData = await approvedAdoptionsRes.json();
        setApprovedAdoptions(approvedAdoptionsData || []);
      }

      // Appointments
      const appointmentsRes = await fetch(
        `${API_BASE_URL}/api/users/${userData.userID}/appointments`,
        { credentials: "include", headers }
      );
      if (!appointmentsRes.ok) {
        const err = await appointmentsRes.json().catch(() => null);
        console.error("Appointments error payload:", err);
        throw new Error(
          err?.detail ||
            `Failed to load appointments (${appointmentsRes.status})`
        );
      }
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData || []);
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  // ========== FETCH PETS ==========
  const fetchPetsAndShelters = useCallback(async () => {
    try {
      const petsRes = await fetch(`${API_BASE_URL}/api/pets`, {
        credentials: "include",
        headers,
      });
      if (petsRes.ok) {
        const petsData = await petsRes.json();
        setPets(petsData || []);
      } else {
        const err = await petsRes.json().catch(() => null);
        console.error("Pets error payload:", err);
      }
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  }, [headers]);

  useEffect(() => {
    if (showNewApplicationModal) {
      fetchPetsAndShelters();
    }
  }, [showNewApplicationModal, fetchPetsAndShelters]);

  // ========== ADOPTION HANDLERS ==========
  const handleAdoptionPetChange = (e) => {
    const petID = parseInt(e.target.value);
    const selectedPet = pets.find((p) => p.petID === petID);
    setNewAdoptionForm((prev) => ({ ...prev, petID }));
    setSelectedAdoptionPet(selectedPet || null);
  };

  const handleRequestAdoptionWithAppointment = async () => {
    if (!newAdoptionForm.petID) {
      setUpdateError("Please select a pet");
      return;
    }

    if (!newAdoptionForm.appointmentTime) {
      setUpdateError("Please select appointment date & time");
      return;
    }

    try {
      setUpdateError(null);
      setUpdateSuccess(null);

      // Step 1: Create Adoption
      const adoptionRes = await fetch(`${API_BASE_URL}/api/adoptions`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          petID: parseInt(newAdoptionForm.petID),
        }),
      });

      if (!adoptionRes.ok) {
        const errData = await adoptionRes.json().catch(() => null);
        throw new Error(
          errData?.detail || "Failed to create adoption request"
        );
      }

      // Step 2: Create Appointment
      const appointmentRes = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          petID: parseInt(newAdoptionForm.petID),
          shelterID: selectedAdoptionPet?.shelterID,
          appointmentTime: newAdoptionForm.appointmentTime + ":00",
          appointmentType: newAdoptionForm.appointmentType || "VISIT",
          notes: newAdoptionForm.appointmentNotes || "",
        }),
      });

      if (!appointmentRes.ok) {
        const errData = await appointmentRes.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to schedule appointment");
      }

      setUpdateSuccess(
        "✓ Adoption submitted!\n✓ Appointment sent for staff approval"
      );
      setShowNewApplicationModal(false);
      setNewAdoptionForm({
        petID: "",
        appointmentTime: "",
        appointmentType: "VISIT",
        appointmentNotes: "",
      });
      setSelectedAdoptionPet(null);

      if (user) {
        fetchProfileData(user);
      }

      setTimeout(() => setUpdateSuccess(null), 4000);
    } catch (err) {
      console.error("Error:", err);
      setUpdateError(err.message || "Failed to process request");
    }
  };

  const handleDeleteAdoption = async (adoptionID) => {
    if (!window.confirm("Delete this adoption application?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/adoptions/${adoptionID}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to delete adoption");

      setUpdateSuccess("Adoption deleted.");
      if (user) fetchProfileData(user);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setUpdateError("Failed to delete adoption");
    }
  };

  // ========== APPOINTMENT HANDLERS ==========
  const handleDeleteAppointment = async (appointmentID) => {
    if (!window.confirm("Delete this appointment?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/appointments/${appointmentID}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to delete appointment");

      setUpdateSuccess("Appointment deleted.");
      if (user) fetchProfileData(user);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setUpdateError("Failed to delete appointment");
    }
  };

  const handleEditAppointment = (appointment) => {
    const dt = new Date(appointment.appointmentTime);
    const dateStr = dt.toISOString().split("T")[0];
    const timeStr = dt.toTimeString().slice(0, 5);
    setEditingAppointmentId(appointment.appointmentID);
    setEditingAppointmentData({
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      notes: appointment.notes || "",
    });
  };

  const handleSaveAppointment = async () => {
    if (!editingAppointmentId || !user) return;

    try {
      setUpdateError(null);
      setUpdateSuccess(null);

      const { appointmentDate, appointmentTime, notes } = editingAppointmentData;
      const isoTime = `${appointmentDate}T${appointmentTime}:00`;

      const res = await fetch(
        `${API_BASE_URL}/api/appointments/${editingAppointmentId}`,
        {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify({
            appointmentTime: isoTime,
            notes: notes || "",
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to update appointment");
      }

      setEditingAppointmentId(null);
      setEditingAppointmentData({});
      setUpdateSuccess("Appointment updated!");
      fetchProfileData(user);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setUpdateError(err.message || "Failed to update appointment");
    }
  };

  const handleCancelEditAppointment = () => {
    setEditingAppointmentId(null);
    setEditingAppointmentData({});
  };

  // ========== PROFILE EDIT HANDLERS ==========
  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateError(null);
    setUpdateSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
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

      const res = await fetch(
        `${API_BASE_URL}/api/users/${user.userID}`,
        {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to update profile");
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUpdateSuccess("Profile updated!");
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
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

  // ========== AUTH + INIT ==========
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      fetchProfileData(parsed);
    } catch {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }, [navigate, fetchProfileData]);

  useEffect(() => {
    const handleFocus = () => {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          fetchProfileData(parsed);
        } catch (err) {
          console.error("Error refreshing:", err);
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchProfileData]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {updateError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
              {updateError}
            </div>
          )}
          {updateSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded whitespace-pre-line">
              {updateSuccess}
            </div>
          )}
          {error && !updateError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Profile
                </h1>
                {!isEditing ? (
                  <>
                    <p className="text-gray-600 mb-2">
                      <strong>Name:</strong> {user?.name}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <strong>Email:</strong> {user?.email}
                    </p>
                    <p className="text-gray-600">
                      <strong>Phone:</strong> {user?.phone || "N/A"}
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("applications")}
                className={`flex-1 py-4 px-6 font-semibold ${
                  activeTab === "applications"
                    ? "bg-blue-100 text-blue-800 border-b-2 border-blue-800"
                    : "text-gray-600"
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`flex-1 py-4 px-6 font-semibold ${
                  activeTab === "approved"
                    ? "bg-blue-100 text-blue-800 border-b-2 border-blue-800"
                    : "text-gray-600"
                }`}
              >
                My Pets
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`flex-1 py-4 px-6 font-semibold ${
                  activeTab === "appointments"
                    ? "bg-blue-100 text-blue-800 border-b-2 border-blue-800"
                    : "text-gray-600"
                }`}
              >
                Appointments
              </button>
            </div>

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Adoption Applications</h2>
                  <button
                    onClick={() => setShowNewApplicationModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    + New Application
                  </button>
                </div>

                {/* Modal with Appointment Fields */}
                {showNewApplicationModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
                      <h3 className="text-2xl font-bold mb-6">
                        New Adoption Application
                      </h3>

                      <div className="mb-4">
                        <label className="block text-gray-700 font-semibold mb-2">
                          Select Pet
                        </label>
                        <select
                          value={newAdoptionForm.petID}
                          onChange={handleAdoptionPetChange}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">-- Choose a pet --</option>
                          {pets.map((pet) => (
                            <option key={pet.petID} value={pet.petID}>
                              {pet.name} ({pet.species})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedAdoptionPet && (
                        <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <p>
                            <strong>Name:</strong> {selectedAdoptionPet.name}
                          </p>
                          <p>
                            <strong>Breed:</strong> {selectedAdoptionPet.breed}
                          </p>
                          <p>
                            <strong>Shelter:</strong>{" "}
                            {selectedAdoptionPet.shelterName}
                          </p>
                        </div>
                      )}

                      {selectedAdoptionPet && (
                        <>
                          <h4 className="text-lg font-semibold mb-3 mt-6">
                            Schedule Appointment
                          </h4>

                          <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                              Preferred Date & Time *
                            </label>
                            <input
                              type="datetime-local"
                              value={newAdoptionForm.appointmentTime || ""}
                              onChange={(e) =>
                                setNewAdoptionForm({
                                  ...newAdoptionForm,
                                  appointmentTime: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>

                          <div className="mb-4">
                            <label className="block text-gray-700 font-semibold mb-2">
                              Type
                            </label>
                            <select
                              value={newAdoptionForm.appointmentType || "VISIT"}
                              onChange={(e) =>
                                setNewAdoptionForm({
                                  ...newAdoptionForm,
                                  appointmentType: e.target.value,
                                })
                              }
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                              <option value="VISIT">Visit</option>
                              <option value="CONSULTATION">Consultation</option>
                              <option value="MEET&GREET">
                                Meet &amp; Greet
                              </option>
                            </select>
                          </div>

                          <div className="mb-6">
                            <label className="block text-gray-700 font-semibold mb-2">
                              Notes
                            </label>
                            <textarea
                              value={newAdoptionForm.appointmentNotes || ""}
                              onChange={(e) =>
                                setNewAdoptionForm({
                                  ...newAdoptionForm,
                                  appointmentNotes: e.target.value,
                                })
                              }
                              placeholder="Any special requests..."
                              className="w-full border border-gray-300 rounded px-3 py-2"
                              rows="3"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={handleRequestAdoptionWithAppointment}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setShowNewApplicationModal(false)}
                          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-b font-semibold">
                          Pet
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Submitted
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Status
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {adoptions.length > 0 ? (
                        adoptions.map((adoption) => (
                          <tr
                            key={adoption.adoptionID}
                            className="hover:bg-gray-50 border-b"
                          >
                            <td className="p-3 font-semibold text-blue-600">
                              {adoption.petName}
                            </td>
                            <td className="p-3">
                              {new Date(
                                adoption.applicationDate
                              ).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  adoption.status === "APPLIED"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : adoption.status === "APPROVED"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {adoption.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() =>
                                  handleDeleteAdoption(adoption.adoptionID)
                                }
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-6 text-center text-gray-500"
                          >
                            No applications yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* My Pets Tab */}
            {activeTab === "approved" && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">My Pets</h2>
                
                {approvedAdoptions.length === 0 ? (
                  <p className="text-gray-500">No approved applications found.</p>
                ) : (
                  <div className="space-y-4">
                    {approvedAdoptions.map((adoption) => (
                      <div key={adoption.adoptionID} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-green-800">
                              {adoption.petName}
                            </h3>
                            <p className="text-gray-600">
                              {adoption.petSpecies} • Approved on {new Date(adoption.approvalDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Link 
                            to={`/pet/${adoption.petID}`}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                          >
                            View Pet Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">My Appointments</h2>

                {editingAppointmentId && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="text-lg font-bold mb-4">
                      Reschedule Appointment
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={
                            editingAppointmentData.appointmentDate || ""
                          }
                          onChange={(e) =>
                            setEditingAppointmentData({
                              ...editingAppointmentData,
                              appointmentDate: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={
                            editingAppointmentData.appointmentTime || ""
                          }
                          onChange={(e) =>
                            setEditingAppointmentData({
                              ...editingAppointmentData,
                              appointmentTime: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-2">
                        Notes
                      </label>
                      <textarea
                        value={editingAppointmentData.notes || ""}
                        onChange={(e) =>
                          setEditingAppointmentData({
                            ...editingAppointmentData,
                            notes: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows="2"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveAppointment}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditAppointment}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-3 border-b font-semibold">
                          Pet
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Type
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Date & Time
                        </th>
                        <th className="text-left p-3 border-b font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.length > 0 ? (
                        appointments.map((apt) => (
                          <tr
                            key={apt.appointmentID}
                            className="hover:bg-gray-50 border-b"
                          >
                            <td className="p-3 font-semibold text-blue-600">
                              {apt.petName}
                            </td>
                            <td className="p-3">{apt.appointmentType}</td>
                            <td className="p-3">
                              {new Date(
                                apt.appointmentTime + "Z"
                              ).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
  {new Date(apt.appointmentTime + "Z") > new Date() && (
    <>
      <button
        onClick={() => handleEditAppointment(apt)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold"
      >
        Edit
      </button>
      <button
        onClick={() =>
          handleDeleteAppointment(apt.appointmentID)
        }
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
      >
        Cancel
      </button>
    </>
  )}
</div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-6 text-center text-gray-500"
                          >
                            No appointments scheduled
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;