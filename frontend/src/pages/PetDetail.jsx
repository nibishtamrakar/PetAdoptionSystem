// src/pages/PetDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import Navbar from "../components/Navbar";

const PetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const fetchPetDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/pets/${id}`);

      if (!res.ok) {
        setError("Failed to load pet");
        return;
      }

      const data = await res.json();
      setPet(data);
    } catch (err) {
      console.error("Failed to load pet:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPetDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#5b8fc0] flex items-center justify-center">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-[#5b8fc0] flex items-center justify-center">
        <p className="text-white text-lg">{error || "Pet not found"}</p>
      </div>
    );
  }

  // compute age & days in care (fallbacks)
  const age =
    pet.ageYears != null ? `${pet.ageYears} yrs` : pet.dob ? "Unknown" : "N/A";

  const daysInCare = pet.intakeDate
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(pet.intakeDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const location = pet.shelterAddress || pet.shelterName || "N/A";
  const weight = pet.weight || "N/A"; // placeholder until you add weight to schema

  const summary =
    pet.summary ||
    `Meet ${pet.name}! ${pet.name} is a ${
      pet.species?.toLowerCase() || "lovely pet"
    } currently cared for at ${pet.shelterName || "our shelter"}.`;

  return (
    <div className="min-h-screen bg-[#5b8fc0] text-white flex flex-col">
      {/* NAVBAR */}
      <Navbar>
  <div className="w-full flex justify-between items-center">
    {/* LEFT SIDE */}
    <Link
      to="/browsepets"
      className="text-2xl font-bold text-white p-6"
    >
      Back to Browse
    </Link>

    {/* RIGHT SIDE */}
    <div className="flex">
      <Link
        to="/profile"
        className="text-2xl font-bold text-white p-6"
      >
        Profile
      </Link>
      <button
        onClick={handleLogout}
        className="text-2xl font-bold text-white p-6"
      >
        Logout
      </button>
    </div>
  </div>
</Navbar>


      {/* push content below fixed nav */}
      <div className="pt-20">
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center pt-10 px-4">
          {/* Avatar */}
          <div className="w-40 h-40 rounded-full bg-[#8ab4e0] flex items-center justify-center shadow-lg">
            {/* replace with actual image later if you have one */}
            <span className="text-6xl">🐾</span>
          </div>

          {/* Divider */}
          <div className="w-full max-w-3xl mt-8 mb-4">
            <hr className="border-t border-white/60" />
          </div>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            {pet.name}
          </h1>

          {/* Info row: id, species, age, location, sex, weight, days in care */}
          <div className="w-full max-w-4xl text-center text-sm md:text-base">
            <div className="grid grid-cols-2 md:grid-cols-7 gap-y-2 mb-2 font-semibold">
              <span>ID</span>
              <span>Species</span>
              <span>Age</span>
              <span>Location</span>
              <span>Sex</span>
              <span>Weight</span>
              <span>Days in care</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-y-1 text-sm md:text-base">
              <span>{pet.petID}</span>
              <span>{pet.species || "N/A"}</span>
              <span>{age}</span>
              <span className="whitespace-normal break-words" title={location}>
                {location}
              </span>
              <span>{pet.sex || "N/A"}</span>
              <span>{weight}</span>
              <span>{daysInCare != null ? daysInCare : "N/A"}</span>
            </div>
          </div>

          {/* Pet summary */}
          <div className="w-full max-w-2xl mt-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Pet Summary</h2>
            <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-10 flex gap-8 flex-wrap justify-center">
            <button
              className="px-10 py-3 rounded-full bg-[#a9c9f5] text-[#234971] font-semibold shadow-md hover:bg-[#c1d9fa] transition"
              onClick={() => {
                console.log("Adopt Me clicked");
              }}
            >
              Adopt Me
            </button>
            <button
              className="px-10 py-3 rounded-full bg-[#a9c9f5] text-[#234971] font-semibold shadow-md hover:bg-[#c1d9fa] transition"
              onClick={() => {
                console.log("Meet Me clicked");
              }}
            >
              Meet Me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
