import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const PetDetail = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [petVaccines, setPetVaccines] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [editedPet, setEditedPet] = useState({});

  // Check if user is staff
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (!["STAFF", "ADMIN"].includes(userData.role)) {
        // Not staff, but can still view pet details
        setUser(userData);
      }
    }
  }, []);

  const fetchPetDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      } : { "Content-Type": "application/json" };

      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, { headers });
      const data = await res.json();
      setPet(data);
      setEditedPet(data);
    } catch (err) {
      console.error("Failed to load pet:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchVaccines = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      } : { "Content-Type": "application/json" };

      const res = await fetch(`http://127.0.0.1:8000/api/vaccines`, { headers });
      const data = await res.json();
      setVaccines(data);
    } catch (err) {
      console.error("Failed to load vaccines:", err);
    }
  }, []);

  const fetchPetVaccines = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      } : { "Content-Type": "application/json" };

      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}/vaccines`, { headers });
      const data = await res.json();
      setPetVaccines(data);
    } catch (err) {
      console.error("Failed to load pet vaccines:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchPetDetail();
    if (user && ["STAFF", "ADMIN"].includes(user.role)) {
      fetchVaccines();
      fetchPetVaccines();
    }
  }, [id, user, fetchPetDetail, fetchVaccines, fetchPetVaccines]);

  const handleUpdatePet = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(editedPet)
      });

      if (res.ok) {
        const data = await res.json();
        setPet(data);
        setEditedPet(data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update pet:", err);
    }
  };

  const handleAddVaccine = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}/vaccines`, {
        method: "POST",
        headers,
        body: JSON.stringify({ vaccineID: parseInt(selectedVaccine) })
      });

      if (res.ok) {
        fetchPetVaccines();
        setShowVaccineModal(false);
        setSelectedVaccine("");
      }
    } catch (err) {
      console.error("Failed to add vaccine:", err);
    }
  };

  const handleDeleteVaccine = async (petVaccineId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}/vaccines/${petVaccineId}`, {
        method: "DELETE",
        headers
      });

      if (res.ok) {
        fetchPetVaccines();
      }
    } catch (err) {
      console.error("Failed to delete vaccine:", err);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!pet) return <p className="text-center mt-20">Pet not found</p>;

  const isStaff = user && ["STAFF", "ADMIN"].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className={`${isStaff ? 'pt-20' : ''} p-10`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-blue-600">
              {isEditing ? (
                <input
                  type="text"
                  value={editedPet.name}
                  onChange={(e) => setEditedPet({...editedPet, name: e.target.value})}
                  className="border-2 border-blue-300 rounded px-2 py-1"
                />
              ) : (
                pet.name
              )}
            </h1>
            {isStaff && (
              <div className="space-x-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdatePet}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedPet(pet);
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Edit Pet
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pet Information */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Pet Information</h2>
              
              <div className="w-32 h-32 rounded-full bg-blue-100 mx-auto mb-6"></div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Species:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedPet.species}
                      onChange={(e) => setEditedPet({...editedPet, species: e.target.value})}
                      className="border rounded px-2 py-1 w-32"
                    />
                  ) : (
                    <span>{pet.species}</span>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Breed:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedPet.breed}
                      onChange={(e) => setEditedPet({...editedPet, breed: e.target.value})}
                      className="border rounded px-2 py-1 w-32"
                    />
                  ) : (
                    <span>{pet.breed}</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Sex:</span>
                  {isEditing ? (
                    <select
                      value={editedPet.sex}
                      onChange={(e) => setEditedPet({...editedPet, sex: e.target.value})}
                      className="border rounded px-2 py-1"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  ) : (
                    <span>{pet.sex}</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  {isEditing ? (
                    <select
                      value={editedPet.status}
                      onChange={(e) => setEditedPet({...editedPet, status: e.target.value})}
                      className="border rounded px-2 py-1"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="ADOPTED">Adopted</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  ) : (
                    <span>{pet.status}</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Shelter:</span>
                  <span>{pet.shelterName}</span>
                </div>
              </div>
            </div>

            {/* Vaccines Section - Staff Only */}
            {isStaff && (
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">Vaccines</h2>
                  <button
                    onClick={() => setShowVaccineModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium text-sm"
                  >
                    Add Vaccine
                  </button>
                </div>

                {showVaccineModal && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-medium mb-2">Add New Vaccine</h3>
                    <select
                      value={selectedVaccine}
                      onChange={(e) => setSelectedVaccine(e.target.value)}
                      className="border rounded px-2 py-1 mr-2"
                    >
                      <option value="">Select Vaccine</option>
                      {vaccines.map(vaccine => (
                        <option key={vaccine.vaccineID} value={vaccine.vaccineID}>
                          {vaccine.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddVaccine}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowVaccineModal(false);
                        setSelectedVaccine("");
                      }}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {petVaccines.length > 0 ? (
                    petVaccines.map(pv => (
                      <div key={pv.petVaccineID} className="flex justify-between items-center p-2 border rounded">
                        <span>{pv.vaccine.name}</span>
                        <button
                          onClick={() => handleDeleteVaccine(pv.petVaccineID)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No vaccines recorded</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
