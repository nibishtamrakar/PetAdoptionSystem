import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import AppointmentModal from "../components/AppointmentModal";

const PetDetail = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  // appointment
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const fetchPetDetail = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/pets/${id}`);
      const data = await res.json();
      setPet(data);
    } catch (err) {
      console.error("Failed to load pet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetDetail();
  }, [id]);

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!pet) return <p className="text-center mt-20">Pet not found</p>;


  // Adoption button
  const applyToAdopt = async () => {
    const token = localStorage.getItem("token");
    const payload = { petID: Number(pet.petID) };

    const res = await fetch(`${API_BASE_URL}/api/adoptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Adoption error raw response:", res.status, text);

      let msg = `Request failed (${res.status})`;

      try {
        const data = JSON.parse(text);
        if (data.detail) {
          msg =
            typeof data.detail === "string"
              ? data.detail
              : JSON.stringify(data.detail);
        }
      } catch {
        // keep default msg
      }

      throw new Error(msg);
    }

    return res.json();
  };

  // Adoption popup
  const handleApplyClick = async () => {
    if (!pet) return; // safety

    const petName = pet.name || "this pet";

    const ok = window.confirm(
      `Submit an adoption application for ${petName}?`
    );
    if (!ok) return;

    await applyToAdopt();
  };


  return (
    <div className="min-h-screen bg-gray-50 p-10">

      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 mt-6">
        <h1 className="text-3xl font-bold mb-4">{pet.name}</h1>

        <div className="w-32 h-32 rounded-full bg-blue-100 mx-auto mb-6"></div>

        <p><strong>Species:</strong> {pet.species}</p>
        <p><strong>Breed:</strong> {pet.breed}</p>
        <p><strong>Sex:</strong> {pet.sex}</p>
        <p><strong>Status:</strong> {pet.status}</p>
        <p><strong>Shelter:</strong> {pet.shelterName}</p>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowAppointmentModal(true)}
          className="px-8 py-2 rounded-full bg-green-500 text-white shadow hover:bg-green-600"
        >
          Schedule Appointment
        </button>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleApplyClick}
          className="mt-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm hover:bg-green-600"
        >
          Apply to Adopt
        </button>
      </div>

      <AppointmentModal
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        pet={pet}
      />

    </div>
  );
};

export default PetDetail;
