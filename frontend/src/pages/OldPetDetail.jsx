// src/pages/OldPetDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import Navbar from "../components/Navbar";

const OldPetDetail = () => {
  const { id } = useParams();

  const [pet, setPet] = useState(null);
  const [editedPet, setEditedPet] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [petVaccines, setPetVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState("");
  const [vaccineDate, setVaccineDate] = useState("");

  const fetchPetDetail = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pets/${id}`);
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
      const user = token ? JSON.parse(localStorage.getItem("user") || "{}") : null;
      
      // Only fetch vaccines for admin and staff users
      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        console.log("User role not authorized for vaccine management");
        return;
      }
      
      const headers = token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      } : { "Content-Type": "application/json" };

      const res = await fetch(`${API_BASE_URL}/api/vaccines`, { headers });
      if (!res.ok) {
        console.error("Failed to fetch vaccines:", res.status);
        setVaccines([]); // Set empty array on error
        return;
      }
      const data = await res.json();
      setVaccines(Array.isArray(data) ? data : []); // Ensure it's an array
    } catch (err) {
      console.error("Failed to load vaccines:", err);
      setVaccines([]); // Set empty array on error
    }
  }, []);

  const fetchPetVaccines = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      } : { "Content-Type": "application/json" };

      const res = await fetch(`${API_BASE_URL}/api/pets/${id}/vaccines`, { headers });
      if (!res.ok) {
        console.error("Failed to fetch pet vaccines:", res.status);
        setPetVaccines([]); // Set empty array on error
        return;
      }
      const data = await res.json();
      setPetVaccines(Array.isArray(data) ? data : []); // Ensure it's an array
    } catch (err) {
      console.error("Failed to load pet vaccines:", err);
    }
  }, [id]);


  useEffect(() => {
    fetchPetDetail();
    fetchVaccines();
    fetchPetVaccines();
  }, [fetchPetDetail, fetchVaccines, fetchPetVaccines]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/pets/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedPet),
      });
      
      if (res.ok) {
        const updatedPet = await res.json();
        setPet(updatedPet);
        setEditedPet(updatedPet);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update pet:", err);
    }
  };

  const handleCancel = () => {
    setEditedPet(pet);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedPet(prev => ({ ...prev, [field]: value }));
  };

  const handleAddVaccine = async () => {
    if (!selectedVaccine || !vaccineDate) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/pets/${id}/vaccines`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vaccineID: selectedVaccine,
          vaccineDate: vaccineDate,
        }),
      });
      
      if (res.ok) {
        // Refresh pet vaccines
        fetchPetVaccines();
        // Clear form
        setSelectedVaccine("");
        setVaccineDate("");
      }
    } catch (err) {
      console.error("Failed to add vaccine:", err);
    }
  };

  const handleRemoveVaccine = async (vaccineID, vaccineDate) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/pets/${id}/vaccines`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vaccineID: vaccineID,
          vaccineDate: vaccineDate,
        }),
      });
      
      if (res.ok) {
        // Refresh pet vaccines
        fetchPetVaccines();
      }
    } catch (err) {
      console.error("Failed to remove vaccine:", err);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!pet) return <p className="text-center mt-20">Pet not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-6">
        <div className="flex gap-6">
          {/* Left column - Pet details */}
          <div className="flex-1 bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">{pet.name}</h1>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="w-32 h-32 rounded-full bg-blue-100 mx-auto mb-6"></div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Species</label>
                  <input
                    type="text"
                    value={editedPet.species || ''}
                    onChange={(e) => handleInputChange('species', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Breed</label>
                  <input
                    type="text"
                    value={editedPet.breed || ''}
                    onChange={(e) => handleInputChange('breed', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sex</label>
                  <select
                    value={editedPet.sex || ''}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Age (Calculated)</label>
                  <input
                    type="text"
                    value={editedPet.ageYears ? `${editedPet.ageYears} years` : 'N/A'}
                    className="w-full p-2 border rounded bg-gray-100"
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editedPet.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={editedPet.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Available">Available</option>
                    <option value="Adopted">Adopted</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p><strong>Species:</strong> {pet.species}</p>
                <p><strong>Breed:</strong> {pet.breed}</p>
                <p><strong>Sex:</strong> {pet.sex === 'M' ? 'Male' : pet.sex === 'F' ? 'Female' : pet.sex}</p>
                <p><strong>Age:</strong> {pet.ageYears ? `${pet.ageYears} yrs` : "N/A"}</p>
                <p><strong>Date of Birth:</strong> {pet.dob ? new Date(pet.dob).toLocaleDateString() : "N/A"}</p>
                <p><strong>Status:</strong> {pet.status}</p>
                <p><strong>Intake Date:</strong> {pet.intakeDate ? new Date(pet.intakeDate).toLocaleDateString() : "N/A"}</p>
                <p><strong>Shelter:</strong> {pet.shelterName}</p>
                <p><strong>Shelter Address:</strong> {pet.shelterAddress || "N/A"}</p>
              </div>
            )}
          </div>

          {/* Right column - Vaccine management */}
          <div className="w-96 bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Vaccination History</h3>
            
            {/* Add vaccine form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-md font-medium mb-3">Add New Vaccine</h4>
              <div className="space-y-3">
                <select
                  value={selectedVaccine}
                  onChange={(e) => setSelectedVaccine(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a vaccine</option>
                  {vaccines.map((vaccine) => (
                    <option key={vaccine.vaccineID} value={vaccine.vaccineID}>
                      {vaccine.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={vaccineDate}
                  onChange={(e) => setVaccineDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleAddVaccine}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Vaccine
                </button>
              </div>
            </div>
            
            {/* Existing vaccines */}
            <div>
              <h4 className="text-md font-medium mb-3">Current Vaccines</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {petVaccines.map((v) => (
                  <div key={`${v.petID}-${v.vaccineID}-${v.vaccineDate}`} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{v.vaccineName || v.name}</div>
                      <div className="text-sm text-gray-600">{v.vaccineDate}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveVaccine(v.vaccineID, v.vaccineDate)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {petVaccines.length === 0 && (
                  <div className="text-gray-500 italic text-center py-4">No vaccines recorded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OldPetDetail;
