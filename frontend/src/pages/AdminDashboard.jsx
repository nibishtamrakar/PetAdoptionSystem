import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("home");
  
  // Data states
  const [user, setUser] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [allCareLogs, setAllCareLogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form states
  const [showAddShelter, setShowAddShelter] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingShelter, setEditingShelter] = useState(null);
  const [newShelter, setNewShelter] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [newPet, setNewPet] = useState({
    name: "",
    species: "",
    breed: "",
    sex: "Male",
    dob: "",
    shelterID: ""
  });
  const [showAddVaccine, setShowAddVaccine] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    name: ""
  });
  const [historyShelterFilter, setHistoryShelterFilter] = useState("");

  // Filter care logs by shelter
  const filteredCareLogs = historyShelterFilter
    ? allCareLogs.filter(log => log.shelterName === historyShelterFilter)
    : allCareLogs;

  // Filter past appointments by shelter  
  const filteredPastAppointments = historyShelterFilter
    ? pastAppointments.filter(apt => apt.shelterName === historyShelterFilter)
    : pastAppointments;

  // Handle tab navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("home");
    }
  }, [searchParams]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };

        // Fetch user info
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Fetch all data
        const [
          sheltersRes,
          petsRes,
          usersRes,
          staffRes,
          upcomingRes,
          pastRes,
          allCareLogsRes,
          vaccinesRes,
          adoptionRes
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/shelters`, { headers }),
          fetch(`${API_BASE_URL}/admin/pets`, { headers }),
          fetch(`${API_BASE_URL}/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/admin/staff`, { headers }),
          fetch(`${API_BASE_URL}/admin/upcoming-appointments`, { headers }),
          fetch(`${API_BASE_URL}/admin/past-appointments`, { headers }),
          fetch(`${API_BASE_URL}/admin/all-care-logs`, { headers }),
          fetch(`${API_BASE_URL}/admin/vaccines`, { headers }),
          fetch(`${API_BASE_URL}/admin/adoption-requests`, { headers })
        ]);

        // Check if all responses are ok
        const responses = [sheltersRes, petsRes, usersRes, staffRes, upcomingRes, pastRes, allCareLogsRes, vaccinesRes, adoptionRes];
        if (!responses.every(res => res.ok)) {
          setError("Failed to fetch some data");
        }

        // Set data
        setShelters(await sheltersRes.json());
        setPets(await petsRes.json());
        setUsers(await usersRes.json());
        setStaff(await staffRes.json());
        setUpcomingAppointments(await upcomingRes.json());
        setPastAppointments(await pastRes.json());
        setAllCareLogs(await allCareLogsRes.json());
        setVaccines(await vaccinesRes.json());
        setAdoptionRequests(await adoptionRes.json());

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Shelter CRUD operations
  const handleAddShelter = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/shelters`, {
        method: "POST",
        headers,
        body: JSON.stringify(newShelter)
      });

      if (res.ok) {
        const data = await res.json();
        setShelters([...shelters, data]);
        setShowAddShelter(false);
        setNewShelter({ name: "", address: "", phone: "" });
      }
    } catch (err) {
      console.error("Error adding shelter:", err);
      setError("Failed to add shelter");
    }
  };

  // Pet CRUD operations
  const handleAddPet = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/admin/pets`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newPet,
          dob: newPet.dob || null,
          intakeDate: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPets([...pets, data]);
        setShowAddPet(false);
        setNewPet({
          name: "",
          species: "",
          breed: "",
          sex: "Male",
          dob: "",
          shelterID: ""
        });
      }
    } catch (err) {
      console.error("Error adding pet:", err);
      setError("Failed to add pet");
    }
  };

  const handleDeletePet = async (petId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/pets/${petId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setPets(pets.filter(pet => pet.petID !== petId));
      }
    } catch (err) {
      console.error("Error deleting pet:", err);
      setError("Failed to delete pet");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setUsers(users.filter(user => user.userID !== userId));
        setStaff(staff.filter(staff => staff.userID !== userId));
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    }
  };

  const handleDeleteShelter = async (shelterId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/shelters/${shelterId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setShelters(shelters.filter(s => s.shelterID !== shelterId));
      }
    } catch (err) {
      console.error("Error deleting shelter:", err);
      setError("Failed to delete shelter");
    }
  };

  const handleAcceptAdoption = async (adoptionId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      const res = await fetch(`${API_BASE_URL}/adoption-requests/${adoptionId}/accept`, {
        method: "PUT",
        headers
      });

      if (res.ok) {
        setAdoptionRequests(adoptionRequests.map(req => 
          req.adoptionID === adoptionId 
            ? { ...req, status: "APPROVED", approvalDate: new Date().toISOString() }
            : req
        ));
      }
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
      
      const res = await fetch(`${API_BASE_URL}/adoption-requests/${adoptionId}/reject`, {
        method: "PUT",
        headers
      });

      if (res.ok) {
        setAdoptionRequests(adoptionRequests.map(req => 
          req.adoptionID === adoptionId 
            ? { ...req, status: "REJECTED" }
            : req
        ));
      }
    } catch (err) {
      console.error("Error rejecting adoption request:", err);
      setError("Network error");
    }
  };

  const handleEditShelter = (shelter) => {
    setEditingShelter({...shelter});
  };

  const handleUpdateShelter = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/shelters/${editingShelter.shelterID}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editingShelter)
      });

      if (res.ok) {
        const updatedShelter = await res.json();
        setShelters(shelters.map(s => s.shelterID === updatedShelter.shelterID ? updatedShelter : s));
        setEditingShelter(null);
      }
    } catch (err) {
      console.error("Error updating shelter:", err);
      setError("Failed to update shelter");
    }
  };

  // Vaccine CRUD operations
  const handleAddVaccine = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/vaccines`, {
        method: "POST",
        headers,
        body: JSON.stringify(newVaccine)
      });

      if (res.ok) {
        const data = await res.json();
        setVaccines([...vaccines, data]);
        setShowAddVaccine(false);
        setNewVaccine({ name: "" });
      }
    } catch (err) {
      console.error("Error adding vaccine:", err);
      setError("Failed to add vaccine");
    }
  };

  const handleDeleteVaccine = async (vaccineId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/vaccines/${vaccineId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        setVaccines(vaccines.filter(v => v.vaccineID !== vaccineId));
      }
    } catch (err) {
      console.error("Error deleting vaccine:", err);
      setError("Failed to delete vaccine");
    }
  };

  // User role management
  const handleMakeStaff = async (userId, shelterId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/make-staff`, {
        method: "POST",
        headers,
        body: JSON.stringify({ shelterID: shelterId })
      });

      if (res.ok) {
        // Refresh users and staff data
        const [usersRes, staffRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/admin/staff`, { headers })
        ]);
        setUsers(await usersRes.json());
        setStaff(await staffRes.json());
      }
    } catch (err) {
      console.error("Error making staff:", err);
      setError("Failed to assign staff role");
    }
  };

  const handleRemoveStaff = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_BASE_URL}/admin/staff/${userId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        // Refresh users and staff data
        const [usersRes, staffRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/admin/staff`, { headers })
        ]);
        setUsers(await usersRes.json());
        setStaff(await staffRes.json());
      }
    } catch (err) {
      console.error("Error removing staff:", err);
      setError("Failed to remove staff role");
    }
  };

  // Navigation helpers
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
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
        <div className="text-2xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => handleTabChange("home")}
            className={`font-semibold hover:text-blue-100 ${
              activeTab === "home" ? "text-white" : "text-white"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`font-semibold hover:text-blue-100 ${
              activeTab === "history" ? "text-white" : "text-white"
            }`}
          >
            History
          </button>
          <button
            onClick={() => handleTabChange("appointments")}
            className={`font-semibold hover:text-blue-100 ${
              activeTab === "appointments" ? "text-white" : "text-white"
            }`}
          >
            Appointments
          </button>
          <button
            onClick={() => handleTabChange("requests")}
            className={`font-semibold hover:text-blue-100 ${
              activeTab === "requests" ? "text-white" : "text-white"
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => handleTabChange("roles")}
            className={`font-semibold hover:text-blue-100 ${
              activeTab === "roles" ? "text-white" : "text-white"
            }`}
          >
            Roles
          </button>
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
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Admin Dashboard</h1>
            {user && (
              <h2 className="text-xl text-gray-600">
                Welcome, {user.name} - System Administration
              </h2>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "home" && (
          <div>
            {/* Shelters Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">All Shelters</h2>
                <button
                  onClick={() => setShowAddShelter(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Add Shelter
                </button>
              </div>

              {showAddShelter && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Add New Shelter</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Shelter Name"
                      value={newShelter.name}
                      onChange={(e) => setNewShelter({...newShelter, name: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={newShelter.phone}
                      onChange={(e) => setNewShelter({...newShelter, phone: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={newShelter.address}
                      onChange={(e) => setNewShelter({...newShelter, address: e.target.value})}
                      className="border rounded px-3 py-2 col-span-2"
                    />
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={handleAddShelter}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddShelter(false);
                        setNewShelter({ name: "", address: "", phone: "" });
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
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
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Address</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Phone</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelters.map((shelter) => (
                      <tr key={shelter.shelterID} className="hover:bg-gray-50">
                        {editingShelter && editingShelter.shelterID === shelter.shelterID ? (
                          <>
                            <td className="p-3 border-b">
                              <input
                                type="text"
                                value={editingShelter.name}
                                onChange={(e) => setEditingShelter({...editingShelter, name: e.target.value})}
                                className="w-full p-1 border rounded"
                              />
                            </td>
                            <td className="p-3 border-b">
                              <input
                                type="text"
                                value={editingShelter.address}
                                onChange={(e) => setEditingShelter({...editingShelter, address: e.target.value})}
                                className="w-full p-1 border rounded"
                              />
                            </td>
                            <td className="p-3 border-b">
                              <input
                                type="text"
                                value={editingShelter.phone}
                                onChange={(e) => setEditingShelter({...editingShelter, phone: e.target.value})}
                                className="w-full p-1 border rounded"
                              />
                            </td>
                            <td className="p-3 border-b">
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleUpdateShelter}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingShelter(null)}
                                  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 border-b font-medium">
                              {shelter.name}
                            </td>
                            <td className="p-3 border-b text-gray-600">{shelter.address}</td>
                            <td className="p-3 border-b text-gray-600">{shelter.phone}</td>
                            <td className="p-3 border-b">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditShelter(shelter)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteShelter(shelter.shelterID)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Pets Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">All Pets</h2>
                <button
                  onClick={() => setShowAddPet(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  Add Pet
                </button>
              </div>

              {/* Add Pet Form */}
              {showAddPet && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-3">Add New Pet</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Pet Name"
                      value={newPet.name}
                      onChange={(e) => setNewPet({...newPet, name: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Species"
                      value={newPet.species}
                      onChange={(e) => setNewPet({...newPet, species: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Breed"
                      value={newPet.breed}
                      onChange={(e) => setNewPet({...newPet, breed: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <select
                      value={newPet.sex}
                      onChange={(e) => setNewPet({...newPet, sex: e.target.value})}
                      className="border rounded px-3 py-2"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <input
                      type="date"
                      placeholder="Date of Birth"
                      value={newPet.dob}
                      onChange={(e) => setNewPet({...newPet, dob: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                    <select
                      value={newPet.shelterID}
                      onChange={(e) => setNewPet({...newPet, shelterID: e.target.value})}
                      className="border rounded px-3 py-2"
                    >
                      <option value="">Select Shelter</option>
                      {shelters.map((shelter) => (
                        <option key={shelter.shelterID} value={shelter.shelterID}>
                          {shelter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={handleAddPet}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPet(false);
                        setNewPet({
                          name: "",
                          species: "",
                          breed: "",
                          sex: "Male",
                          dob: "",
                          shelterID: ""
                        });
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
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
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Species</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Breed</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Sex</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pets.map((pet) => (
                      <tr key={pet.petID} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <button
                            onClick={() => navigate(`/pet/${pet.petID}`)}
                            className="text-blue-600 font-medium hover:underline"
                          >
                            {pet.name}
                          </button>
                        </td>
                        <td className="p-3 border-b text-gray-600">{pet.species}</td>
                        <td className="p-3 border-b text-gray-600">{pet.breed}</td>
                        <td className="p-3 border-b text-gray-600">{pet.sex === 'M' ? 'Male' : pet.sex === 'F' ? 'Female' : pet.sex}</td>
                        <td className="p-3 border-b text-gray-600">{pet.status}</td>
                        <td className="p-3 border-b text-gray-600">{pet.shelterName}</td>
                        <td className="p-3 border-b">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => navigate(`/pet/${pet.petID}`)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              View Pet
                            </button>
                            <button
                              onClick={() => handleDeletePet(pet.petID)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Upcoming Appointments</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Visitor</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingAppointments.map((apt) => {
                      const pet = pets.find((p) => p.petID === apt.petID);
                      const adopter = users.find((u) => u.userID === apt.adopterID);
                      return (
                        <tr key={apt.appointmentID} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            <button
                              onClick={() => pet && navigate(`/pet/${pet.petID}`)}
                              className="text-blue-600 font-medium hover:underline"
                            >
                              {pet ? pet.name : 'Unknown'}
                            </button>
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
                          <td className="p-3 border-b text-gray-600">{pet?.shelterName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vaccines Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">All Vaccines</h2>
                <button
                  onClick={() => setShowAddVaccine(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Add Vaccine
                </button>
              </div>

              {showAddVaccine && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Add New Vaccine</h3>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Vaccine Name"
                      value={newVaccine.name}
                      onChange={(e) => setNewVaccine({...newVaccine, name: e.target.value})}
                      className="border rounded px-3 py-2"
                    />
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={handleAddVaccine}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddVaccine(false);
                        setNewVaccine({ name: "" });
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
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
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Vaccine Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccines.map((vaccine) => (
                      <tr key={vaccine.vaccineID} className="hover:bg-gray-50">
                        <td className="p-3 border-b font-medium">{vaccine.name}</td>
                        <td className="p-3 border-b">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteVaccine(vaccine.vaccineID)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">System History</h1>
              <h2 className="text-xl text-gray-600">
                All care logs and previous appointments across all shelters
              </h2>
            </div>

            {/* Shelter Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-4">
                <label className="font-semibold text-gray-700">Filter by Shelter:</label>
                <select
                  value={historyShelterFilter}
                  onChange={(e) => setHistoryShelterFilter(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="">All Shelters</option>
                  {shelters.map((shelter) => (
                    <option key={shelter.shelterID} value={shelter.name}>
                      {shelter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Care Logs */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                All Care Logs {historyShelterFilter && `(${historyShelterFilter})`}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Care Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Notes</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCareLogs.map((log) => (
                      <tr key={log.careLogID} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <button
                            onClick={() => navigate(`/pet/${log.petID}`)}
                            className="text-blue-600 font-medium hover:underline"
                          >
                            {log.petName}
                          </button>
                        </td>
                        <td className="p-3 border-b">{log.careType}</td>
                        <td className="p-3 border-b">{new Date(log.careDate).toLocaleDateString()}</td>
                        <td className="p-3 border-b text-gray-600">{log.notes}</td>
                        <td className="p-3 border-b">{log.shelterName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Past Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Past Appointments {historyShelterFilter && `(${historyShelterFilter})`}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Adopter</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPastAppointments.map((apt) => (
                      <tr key={apt.appointmentID} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <button
                            onClick={() => navigate(`/pet/${apt.petID}`)}
                            className="text-blue-600 font-medium hover:underline"
                          >
                            {apt.petName}
                          </button>
                        </td>
                        <td className="p-3 border-b">{apt.adopterName}</td>
                        <td className="p-3 border-b">
                          {new Date(apt.appointmentTime + 'Z').toLocaleDateString()}
                        </td>
                        <td className="p-3 border-b">{apt.appointmentType}</td>
                        <td className="p-3 border-b">{apt.shelterName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === "appointments" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">All Appointments</h1>
              <h2 className="text-xl text-gray-600">
                All upcoming and previous appointments across all shelters
              </h2>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upcoming Appointments</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Visitor</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Type</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
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
                          <td className="p-3 border-b text-gray-600">{pet?.shelterName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">All Adoption Requests</h1>
              <h2 className="text-xl text-gray-600">
                All adoption requests across all shelters
              </h2>
            </div>

            {/* Pending Adoption Requests */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pending Adoption Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Adopter Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Application Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptionRequests
                      .filter(request => request.status === 'APPLIED')
                      .map((request) => {
                      const pet = pets.find((p) => p.petID === request.petID);
                      const adopter = users.find((u) => u.userID === request.adopterID);
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
                          <td className="p-3 border-b">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="p-3 border-b text-gray-600">{pet?.shelterName}</td>
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
              </div>
            </div>

            {/* Past Adoption Requests */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Past Adoption Requests</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Pet Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Adopter Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Application Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Approval Date</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptionRequests
                      .filter(request => request.status !== 'APPLIED')
                      .sort((a, b) => new Date(b.approvalDate || b.applicationDate) - new Date(a.approvalDate || a.applicationDate))
                      .map((request) => {
                      const pet = pets.find((p) => p.petID === request.petID);
                      const adopter = users.find((u) => u.userID === request.adopterID);
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
                            {request.approvalDate ? new Date(request.approvalDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-3 border-b">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="p-3 border-b text-gray-600">{pet?.shelterName}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-blue-600 mb-2">User Roles Management</h1>
              <h2 className="text-xl text-gray-600">
                Manage user roles and staff assignments
              </h2>
            </div>

            {/* All Users */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Email</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Current Role</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const staffMember = staff.find(s => s.userID === user.userID);
                      return (
                        <tr key={user.userID} className="hover:bg-gray-50">
                          <td className="p-3 border-b font-medium">{user.name}</td>
                          <td className="p-3 border-b text-gray-600">{user.email}</td>
                          <td className="p-3 border-b">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'STAFF' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                              {staffMember && ` - ${staffMember.shelter?.name}`}
                            </span>
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex space-x-2">
                              {user.role !== 'ADMIN' && user.role !== 'STAFF' && (
                                <>
                                  <select
                                    className="border rounded px-2 py-1 text-sm"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleMakeStaff(user.userID, parseInt(e.target.value));
                                      }
                                    }}
                                  >
                                    <option value="">Make Staff...</option>
                                    {shelters.map(shelter => (
                                      <option key={shelter.shelterID} value={shelter.shelterID}>
                                        {shelter.name}
                                      </option>
                                    ))}
                                  </select>
                                </>
                              )}
                              {user.role === 'STAFF' && (
                                <>
                                  <button
                                    onClick={() => handleRemoveStaff(user.userID)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm mr-2"
                                  >
                                    Remove Staff
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.userID)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Delete User
                                  </button>
                                </>
                              )}
                              {user.role === 'ADOPTER' && (
                                <button
                                  onClick={() => handleDeleteUser(user.userID)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                >
                                  Delete User
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Current Staff */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Staff Members</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Staff Name</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Email</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Shelter</th>
                      <th className="text-left p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((staffMember) => {
                      const user = users.find(u => u.userID === staffMember.userID);
                      return (
                        <tr key={staffMember.staffID} className="hover:bg-gray-50">
                          <td className="p-3 border-b font-medium">{user?.name}</td>
                          <td className="p-3 border-b text-gray-600">{user?.email}</td>
                          <td className="p-3 border-b text-gray-600">{staffMember.shelter?.name}</td>
                          <td className="p-3 border-b">
                            <button
                              onClick={() => handleRemoveStaff(staffMember.userID)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Remove Staff
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
