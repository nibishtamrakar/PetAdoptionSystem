import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StaffPetCard from "../components/StaffPetCard";
import { API_BASE_URL } from "../config";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [careLogs, setCareLogs] = useState([]); // Add back care logs
  const [recentCareLogs, setRecentCareLogs] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [allCareLogs, setAllCareLogs] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [appointments, setAppointments] = useState([]); // For appointment management
  const [user, setUser] = useState(null);
  const [shelterName, setShelterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("home"); // home, history, requests
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

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['home', 'history', 'requests'].includes(tab)) {
      setActiveTab(tab);
    } else {
      // If no tab parameter, default to home
      setActiveTab('home');
    }
  }, [searchParams]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  const handleAddCareLog = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/staff-care-logs`, {
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
      setRecentCareLogs([data, ...recentCareLogs]);
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
      
      const res = await fetch(`${API_BASE_URL}/api/staff-care-logs/${careId}`, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        setError("Failed to delete care log");
        return;
      }

      setCareLogs(careLogs.filter(log => log.careID !== careId));
      setRecentCareLogs(recentCareLogs.filter(log => log.careID !== careId));
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
      
      // Parse the datetime-local value as local time
      const [datePart, timePart] = newAppointment.appointmentTime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create Date object in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);
      
      // Debug logging
      console.log('Input:', newAppointment.appointmentTime);
      console.log('Parsed:', { year, month, day, hours, minutes });
      console.log('Local Date:', localDate);
      console.log('ISO String:', localDate.toISOString());
      
      const res = await fetch(`${API_BASE_URL}/api/staff-appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newAppointment,
          appointmentTime: newAppointment.appointmentTime + ':00' // Add seconds
        })
      });

      if (!res.ok) {
        setError("Failed to add appointment");
        return;
      }

      const data = await res.json();
      console.log('Response:', data);
      setAppointments([...appointments, data]);
      setUpcomingAppointments([...upcomingAppointments, data]);
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
      
      // Parse the datetime-local value as local time
      const [datePart, timePart] = editingAppointment.appointmentTime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create Date object in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes);
      
      // Debug logging
      console.log('Input:', editingAppointment.appointmentTime);
      console.log('Parsed:', { year, month, day, hours, minutes });
      console.log('Local Date:', localDate);
      console.log('ISO String:', localDate.toISOString());
      
      const res = await fetch(`${API_BASE_URL}/api/staff-appointments/${editingAppointment.appointmentID}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          ...editingAppointment,
          appointmentTime: localDate.toISOString()
        })
      });

      if (!res.ok) {
        setError("Failed to update appointment");
        return;
      }

      const data = await res.json();
      console.log('Response:', data);
      console.log('Response time:', data.appointmentTime);
      console.log('Response time as Date:', new Date(data.appointmentTime));
      console.log('Response time local:', new Date(data.appointmentTime).toLocaleTimeString());
      setAppointments(appointments.map(apt => 
        apt.appointmentID === data.appointmentID ? data : apt
      ));
      setUpcomingAppointments(upcomingAppointments.map(apt => 
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
      
      const res = await fetch(`${API_BASE_URL}/api/staff-appointments/${appointmentId}`, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        setError("Failed to delete appointment");
        return;
      }

      setAppointments(appointments.filter(apt => apt.appointmentID !== appointmentId));
      setUpcomingAppointments(upcomingAppointments.filter(apt => apt.appointmentID !== appointmentId));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      setError("Network error");
    }
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
        
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login", { replace: true });
          return;
        }

        const user = JSON.parse(storedUser);
        setUser(user);

        const [petsRes, usersRes, careLogsRes, appointmentsRes, recentCareLogsRes, upcomingAppointmentsRes, allCareLogsRes, pastAppointmentsRes, adoptionRequestsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/staff-pets`, { headers }),
          fetch(`${API_BASE_URL}/api/users`, { headers }),
          fetch(`${API_BASE_URL}/api/staff-care-logs`, { headers }),
          fetch(`${API_BASE_URL}/api/staff-appointments`, { headers }),
          fetch(`${API_BASE_URL}/api/recent-care-logs`, { headers }),
          fetch(`${API_BASE_URL}/api/upcoming-appointments`, { headers }),
          fetch(`${API_BASE_URL}/api/all-care-logs`, { headers }),
          fetch(`${API_BASE_URL}/api/past-appointments`, { headers }),
          fetch(`${API_BASE_URL}/api/adoption-requests`, { headers })
        ]);

        if (!petsRes.ok || !usersRes.ok || !careLogsRes.ok || !appointmentsRes.ok || !recentCareLogsRes.ok || !upcomingAppointmentsRes.ok || !allCareLogsRes.ok || !pastAppointmentsRes.ok || !adoptionRequestsRes.ok) {
          setError("Failed to load data");
          return;
        }

        const [petsData, usersData, careLogsData, appointmentsData, recentCareLogsData, upcomingAppointmentsData, allCareLogsData, pastAppointmentsData, adoptionRequestsData] = await Promise.all([
          petsRes.json(),
          usersRes.json(),
          careLogsRes.json(),
          appointmentsRes.json(),
          recentCareLogsRes.json(),
          upcomingAppointmentsRes.json(),
          allCareLogsRes.json(),
          pastAppointmentsRes.json(),
          adoptionRequestsRes.json()
        ]);

        setPets(petsData);
        setUsers(usersData);
        setCareLogs(careLogsData);
        setAppointments(appointmentsData);
        setRecentCareLogs(recentCareLogsData);
        setUpcomingAppointments(upcomingAppointmentsData);
        setAllCareLogs(allCareLogsData);
        setPastAppointments(pastAppointmentsData);
        setAdoptionRequests(adoptionRequestsData);

        if (petsData && petsData.length > 0 && petsData[0].shelterName) {
          setShelterName(petsData[0].shelterName);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAcceptAdoption = async (adoptionId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/adoption-requests/${adoptionId}/accept`, {
        method: "PUT",
        headers
      });

      if (!res.ok) {
        setError("Failed to accept adoption request");
        return;
      }

      // Refresh adoption requests and pets
      await fetchAdoptionRequests();
      await fetchPets();
    } catch (err) {
      console.error("Error accepting adoption request:", err);
      setError("Network error");
    }
  };

  const handleRejectAdoption = async (adoptionId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/adoption-requests/${adoptionId}/reject`, {
        method: "PUT",
        headers
      });

      if (!res.ok) {
        setError("Failed to reject adoption request");
        return;
      }

      // Refresh adoption requests
      await fetchAdoptionRequests();
    } catch (err) {
      console.error("Error rejecting adoption request:", err);
      setError("Network error");
    }
  };

  const fetchAdoptionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/adoption-requests`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAdoptionRequests(data);
      }
    } catch (err) {
      console.error("Error fetching adoption requests:", err);
    }
  };

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/api/staff-pets`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPets(data);
      }
    } catch (err) {
      console.error("Error fetching pets:", err);
    }
  };

  const getAppointmentsForAdoption = (petId, adopterId) => {
    return appointments.filter(apt => 
      apt.petID === petId && apt.adopterID === adopterId
    );
  };

  const handleEditPet = (pet) => {
    // For now, navigate to pet details page
    // Could be enhanced to open edit modal in the future
    navigate(`/pet/${pet.petID}`);
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
        {/* Only show original header on Home tab */}
        {activeTab === "home" && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Staff Dashboard</h1>
            {user && (
              <h2 className="text-xl text-gray-600">
                Welcome, {user.name} - Shelter: {shelterName || 'Loading...'}
              </h2>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "home" && (
          <div>
            {/* Recent Care Logs Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Recent Care Logs</h2>
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

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Care Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Notes</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCareLogs.map((log) => {
                      const pet = pets.find((p) => p.petID === log.petID);
                      return (
                        <tr key={log.careID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <span className="text-blue-600 font-medium">
                              {pet ? pet.name : 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 border-b font-medium">{log.careType}</td>
                          <td className="p-3 border-b text-gray-600">
                            {new Date(log.careDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 border-b text-gray-700">
                            {log.notes || '-'}
                          </td>
                          <td className="p-3 border-b">
                            <button
                              onClick={() => handleDeleteCareLog(log.careID)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {recentCareLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent care logs found
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Upcoming Appointments</h2>
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
                    <select
                      value={newAppointment.adopterID}
                      onChange={(e) => setNewAppointment({...newAppointment, adopterID: e.target.value})}
                      className="border border-blue-300 rounded-lg p-2"
                    >
                      <option value="">Select Visitor</option>
                      {users.map(user => (
                        <option key={user.userID} value={user.userID}>{user.name}</option>
                      ))}
                    </select>
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
                  <h3 className="text-lg font-semibold mb-3">Reschedule Appointment</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={editingAppointment.appointmentTime}
                        onChange={(e) => setEditingAppointment({...editingAppointment, appointmentTime: e.target.value})}
                        className="border border-blue-300 rounded-lg p-2 w-full"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={handleUpdateAppointment}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                    >
                      Reschedule
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

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Visitor</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((apt) => {
                      const pet = pets.find((p) => p.petID === apt.petID);
                      const adopter = users.find((u) => u.userID === apt.adopterID);
                      return (
                        <tr key={apt.appointmentID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <span className="text-blue-600 font-medium">
                              {pet ? pet.name : 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 border-b text-gray-700">
                            {adopter ? adopter.name : 'Unknown Visitor'}
                          </td>
                          <td className="p-3 border-b font-medium">{apt.appointmentType}</td>
                          <td className="p-3 border-b text-gray-600">
                            {new Date(apt.appointmentTime + 'Z').toLocaleDateString()} at{' '}
                            {new Date(apt.appointmentTime + 'Z').toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => setEditingAppointment(apt)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleDeleteAppointment(apt.appointmentID)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming appointments found
                  </div>
                )}
              </div>
            </div>

            {/* Pets Section */}
            <div className="mb-8 mt-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Shelter Pets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pets.map((pet) => (
                  <StaffPetCard key={pet.petID} pet={pet} onEdit={handleEditPet} />
                ))}
              </div>
              {pets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pets found in your shelter
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">{shelterName || 'Shelter'} - Shelter History</h1>
              <h2 className="text-xl text-gray-600">
                All care logs and previous appointments at {shelterName || 'the shelter'}
              </h2>
            </div>
            
            {/* All Care Logs Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Care Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Care Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Notes</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCareLogs.map((log) => {
                      const pet = pets.find((p) => p.petID === log.petID);
                      return (
                        <tr key={log.careID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <span className="text-blue-600 font-medium">
                              {pet ? pet.name : 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 border-b font-medium">{log.careType}</td>
                          <td className="p-3 border-b text-gray-600">
                            {new Date(log.careDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 border-b text-gray-700">
                            {log.notes || '-'}
                          </td>
                          <td className="p-3 border-b">
                            <button
                              onClick={() => handleDeleteCareLog(log.careID)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {allCareLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No care logs found
                  </div>
                )}
              </div>
            </div>

            {/* Past Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Past Appointments</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Visitor</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastAppointments.map((apt) => {
                      const pet = pets.find((p) => p.petID === apt.petID);
                      const adopter = users.find((u) => u.userID === apt.adopterID);
                      return (
                        <tr key={apt.appointmentID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <span className="text-blue-600 font-medium">
                              {pet ? pet.name : 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 border-b text-gray-700">
                            {adopter ? adopter.name : 'Unknown Visitor'}
                          </td>
                          <td className="p-3 border-b font-medium">{apt.appointmentType}</td>
                          <td className="p-3 border-b text-gray-600">
                            {new Date(apt.appointmentTime + 'Z').toLocaleDateString()} at{' '}
                            {new Date(apt.appointmentTime + 'Z').toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pastAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No past appointments found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">{shelterName || 'Shelter'} - Adoption Requests</h1>
              <h2 className="text-xl text-gray-600">
                Pending adoption requests
              </h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Adoption Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Adopter Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Application Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Related Appointments</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptionRequests.map((request) => {
                      const pet = pets.find((p) => p.petID === request.petID);
                      const adopter = users.find((u) => u.userID === request.adopterID);
                      const relatedAppointments = getAppointmentsForAdoption(request.petID, request.adopterID);
                      return (
                        <tr key={request.adoptionID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <span className="text-blue-600 font-medium">
                              {pet ? pet.name : 'Unknown'}
                            </span>
                          </td>
                          <td className="p-3 border-b text-gray-700">
                            {adopter ? adopter.name : 'Unknown Adopter'}
                          </td>
                          <td className="p-3 border-b text-gray-600">
                            {new Date(request.applicationDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 border-b text-gray-600">
                            {relatedAppointments.length > 0 ? (
                              <div className="text-sm">
                                {relatedAppointments.map((apt) => (
                                  <div key={apt.appointmentID} className="mb-1">
                                    {apt.appointmentType} - {new Date(apt.appointmentTime).toLocaleDateString()}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No appointments</span>
                            )}
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleAcceptAdoption(request.adoptionID)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectAdoption(request.adoptionID)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {adoptionRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No adoption requests found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
