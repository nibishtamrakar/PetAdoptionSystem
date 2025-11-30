import React from "react";
import { Link } from "react-router-dom";

const StaffPetCard = ({ pet, onEdit }) => {
  return (
    <div className="relative">
      <Link to={`/pet/${pet.petID}`} className="block">
        <div className={`rounded-3xl shadow-xl flex flex-col overflow-hidden min-h-[430px] md:min-h-[460px] border-2 hover:scale-[1.02] hover:shadow-2xl transition-transform duration-200 cursor-pointer ${
          pet.status === "ADOPTED" 
            ? "bg-gray-300 border-gray-400" 
            : "bg-blue-200 border-[#5699C9]"
        }`}>

          {/* top image */}
          <div className={`flex flex-col items-center justify-center py-10 ${
            pet.status === "ADOPTED" ? "bg-gray-400" : "bg-blue-300"
          }`}>
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center ${
              pet.status === "ADOPTED" ? "bg-gray-200" : "bg-blue-100"
            }`}>
              {/* placeholder for future image */}
            </div>
          </div>

          {/* info */}
          <div className={`border-t px-6 py-5 text-center rounded-b-3xl flex flex-col flex-1 ${
            pet.status === "ADOPTED" 
              ? "text-gray-600 bg-gray-500 border-gray-400" 
              : "text-white bg-[#5699C9] border-white"
          }`}>

            {/* name */}
            <div className="text-3xl font-semibold mb-3">
              {pet.name || "Unnamed"}
            </div>

            {/* each detail on its own line */}
            <div className="text-sm md:text-base leading-snug mb-1">
              Species: {pet.species || "Unknown"}
            </div>

            <div className="text-sm md:text-base leading-snug mb-1">
              Breed: {pet.breed || "Unknown"}
            </div>

            <div className="text-sm md:text-base leading-snug mb-1">
              Sex: {pet.sex === 'M' ? 'Male' : pet.sex === 'F' ? 'Female' : pet.sex}
            </div>

            <div className="text-sm md:text-base leading-snug mb-1">
              Status: {pet.status}
            </div>

            <div className="text-sm md:text-base leading-snug mb-3">
              Shelter: {pet.shelterName}
            </div>

            <p className="mt-auto text-xs underline">View Details</p>
          </div>

        </div>
      </Link>
      
      {/* Edit button overlay */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit(pet);
        }}
        className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-medium shadow-lg hover:bg-blue-50 transition-colors"
      >
        Edit
      </button>
    </div>
  );
};

export default StaffPetCard;
