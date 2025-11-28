import React from "react";
import { Link } from "react-router-dom";

const StaffPetCard = ({ pet, onEdit }) => {
  return (
    <div className="relative">
      <Link to={`/pet/${pet.petID}`} className="block">
        <div className="bg-blue-200 rounded-3xl shadow-xl flex flex-col overflow-hidden min-h-[430px] md:min-h-[460px] border-[#5699C9] border-2 hover:scale-[1.02] hover:shadow-2xl transition-transform duration-200 cursor-pointer">

          {/* top image */}
          <div className="flex flex-col items-center justify-center py-10 bg-blue-300">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-blue-100 flex items-center justify-center">
              {/* placeholder for future image */}
            </div>
          </div>

          {/* info */}
          <div className="border-t border-white px-6 py-5 text-center text-white bg-[#5699C9] rounded-b-3xl flex flex-col flex-1">

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
              Sex: {pet.sex}
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
