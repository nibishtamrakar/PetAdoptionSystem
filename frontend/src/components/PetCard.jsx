// src/components/PetCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const PetCard = ({ pet }) => {
  return (
    <div className="bg-blue-200 rounded-3xl shadow-xl flex flex-col overflow-hidden h-[500px]">
      {/* blank image placeholder */}
      <div className="flex flex-col items-center justify-center py-12 bg-blue-300">
        <div className="w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center">
          {/* later replace this with an <img /> */}
        </div>
      </div>

      {/* info */}
      <div className="border-t border-white px-6 py-5 text-center text-white bg-blue-400 rounded-b-3xl flex flex-col flex-1">
        <div className="text-4xl font-semibold mb-3">
          {pet.name || "Unnamed"}
        </div>
        <div className="flex justify-between text-[15px] md:text-xl leading-snug mb-2">
          <span>{pet.species || "Unknown"}</span>
          <span>{pet.breed || "Unknown"}</span>
          <span>{pet.sex}</span>
          <span>{pet.status}</span>
        </div>
        <div className="text-[11px] md:text-xl mt-1 mb-3 leading-snug">
          Shelter: {pet.shelterName}
        </div>
        
        <Link 
        to={`/pet/${pet.petID}`} 
        className="mt-auto text-xs underline"
        >
        View Details
        </Link>
      </div>
    </div>
  );
};

export default PetCard;
