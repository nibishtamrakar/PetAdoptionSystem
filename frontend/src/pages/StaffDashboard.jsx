import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

const StaffDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const user = JSON.parse(storedUser);
    if (!["STAFF", "ADMIN"].includes(user.role)) {
      navigate("/homepage", { replace: true });
    }
  }, [navigate]);

  const [careLogs, setCareLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddCareLog, setShowAddCareLog] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [newCareLog, setNewCareLog] = useState({
    petID: "",
    careType: "",
    notes: ""
  });

  const [newAppointment, setNewAppointment] = useState({
    petID: "",
    adopterID: "",
    shelterID: "",
    appointmentTime: "",
    appointmentType: ""
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/homepage", { replace: true });
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          return;
        }
        
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        
        const [careLogsRes, appointmentsRes, petsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/care-logs`, { headers }),
          fetch(`${API_BASE_URL}/api/appointments`, { headers }),
          fetch(`${API_BASE_URL}/api/pets`, { headers })
        ]);

        if (!careLogsRes.ok || !appointmentsRes.ok || !petsRes.ok) {
          setError("Failed to load data");
          return;
        }

        const [careLogsData, appointmentsData, petsData] = await Promise.all([
          careLogsRes.json(),
          appointmentsRes.json(),
          petsRes.json()
        ]);

        setCareLogs(careLogsData);
        setAppointments(appointmentsData);
        setPets(petsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddCareLog = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/care-logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(newCareLog)
      });

      if (!res.ok) {
        setError("Failed to add care log");
        return;
      }

      const data = await res.json();
      setCareLogs([data, ...careLogs]);
      setShowAddCareLog(false);
      setNewCareLog({ petID: "", careType: "", notes: "" });
    } catch (err) {
      console.error("Error adding care log:", err);
      setError("Network error");
    }
  };

  const handleDeleteCareLog = async (careId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/care-logs/${careId}`, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        setError("Failed to delete care log");
        return;
      }

      setCareLogs(careLogs.filter(log => log.careID !== careId));
    } catch (err) {
      console.error("Error deleting care log:", err);
      setError("Network error");
    }
  };

  const handleAddAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newAppointment,
          appointmentTime: new Date(newAppointment.appointmentTime).toISOString()
        })
      });

      if (!res.ok) {
        setError("Failed to add appointment");
        return;
      }

      const data = await res.json();
      setAppointments([...appointments, data]);
      setShowAddAppointment(false);
      setNewAppointment({
        petID: "",
        adopterID: "",
        shelterID: "",
        appointmentTime: "",
        appointmentType: ""
      });
    } catch (err) {
      console.error("Error adding appointment:", err);
      setError("Network error");
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/appointments/${editingAppointment.appointmentID}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...editingAppointment,
          appointmentTime: new Date(editingAppointment.appointmentTime).toISOString()
        })
      });

      if (!res.ok) {
        setError("Failed to update appointment");
        return;
      }

      const data = await res.json();
      setAppointments(appointments.map(apt => 
        apt.appointmentID === data.appointmentID ? data : apt
      ));
      setEditingAppointment(null);
    } catch (err) {
      console.error("Error updating appointment:", err);
      setError("Network error");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        setError("Failed to delete appointment");
        return;
      }

      setAppointments(appointments.filter(apt => apt.appointmentID !== appointmentId));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      setError("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen justify-center items-center">
        <div className="text-2xl text-red-500">{error}</div>
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
        <h1 className="text-4xl font-bold text-blue-600 mb-8">Staff Dashboard</h1>

        {/* Care Logs Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Care Logs</h2>
            <button
              onClick={() => setShowAddCareLog(true)}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-semibold"
            >
              Add Care Log
            </button>
          </div>

          {showAddCareLog && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">New Care Log</h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newCareLog.petID}
                  onChange={(e) => setNewCareLog({...newCareLog, petID: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                >
                  <option value="">Select Pet</option>
                  {pets.map(pet => (
                    <option key={pet.petID} value={pet.petID}>{pet.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Care Type"
                  value={newCareLog.careType}
                  onChange={(e) => setNewCareLog({...newCareLog, careType: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                />
                <textarea
                  placeholder="Notes"
                  value={newCareLog.notes}
                  onChange={(e) => setNewCareLog({...newCareLog, notes: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2 col-span-2"
                  rows="3"
                />
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleAddCareLog}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddCareLog(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {careLogs.map(log => (
              <div key={log.careID} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{log.careType}</p>
                    <p className="text-sm text-gray-600">{new Date(log.careDate).toLocaleDateString()}</p>
                    {log.notes && <p className="text-gray-700 mt-1">{log.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteCareLog(log.careID)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Appointments</h2>
            <button
              onClick={() => setShowAddAppointment(true)}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-semibold"
            >
              Add Appointment
            </button>
          </div>

          {showAddAppointment && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">New Appointment</h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newAppointment.petID}
                  onChange={(e) => setNewAppointment({...newAppointment, petID: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                >
                  <option value="">Select Pet</option>
                  {pets.map(pet => (
                    <option key={pet.petID} value={pet.petID}>{pet.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Adopter ID"
                  value={newAppointment.adopterID}
                  onChange={(e) => setNewAppointment({...newAppointment, adopterID: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                />
                <input
                  type="datetime-local"
                  value={newAppointment.appointmentTime}
                  onChange={(e) => setNewAppointment({...newAppointment, appointmentTime: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                />
                <select
                  value={newAppointment.appointmentType}
                  onChange={(e) => setNewAppointment({...newAppointment, appointmentType: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                >
                  <option value="">Select Type</option>
                  <option value="VISIT">Visit</option>
                  <option value="MEET&GREET">Meet & Greet</option>
                  <option value="VET">Vet</option>
                </select>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleAddAppointment}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddAppointment(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {editingAppointment && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3">Edit Appointment</h3>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={editingAppointment.petID}
                  onChange={(e) => setEditingAppointment({...editingAppointment, petID: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                >
                  <option value="">Select Pet</option>
                  {pets.map(pet => (
                    <option key={pet.petID} value={pet.petID}>{pet.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Adopter ID"
                  value={editingAppointment.adopterID}
                  onChange={(e) => setEditingAppointment({...editingAppointment, adopterID: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                />
                <input
                  type="datetime-local"
                  value={editingAppointment.appointmentTime}
                  onChange={(e) => setEditingAppointment({...editingAppointment, appointmentTime: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                />
                <select
                  value={editingAppointment.appointmentType}
                  onChange={(e) => setEditingAppointment({...editingAppointment, appointmentType: e.target.value})}
                  className="border border-blue-300 rounded-lg p-2"
                >
                  <option value="">Select Type</option>
                  <option value="VISIT">Visit</option>
                  <option value="MEET&GREET">Meet & Greet</option>
                  <option value="VET">Vet</option>
                </select>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleUpdateAppointment}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Update
                </button>
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {appointments.map(apt => (
              <div key={apt.appointmentID} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{apt.appointmentType}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(apt.appointmentTime).toLocaleDateString()} at {new Date(apt.appointmentTime).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">Pet ID: {apt.petID}</p>
                    <p className="text-sm text-gray-600">Adopter ID: {apt.adopterID}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingAppointment(apt)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(apt.appointmentID)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pets Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pets in Shelter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map(pet => (
              <div key={pet.petID} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg">{pet.name}</h3>
                <p className="text-gray-600">{pet.species} - {pet.breed}</p>
                <p className="text-gray-600">{pet.sex}</p>
                <p className="text-gray-600">Status: {pet.status}</p>
                <p className="text-sm text-gray-500">Intake: {new Date(pet.intakeDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
