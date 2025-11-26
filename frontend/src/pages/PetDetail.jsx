import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const PetDetail = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
};

export default PetDetail;
