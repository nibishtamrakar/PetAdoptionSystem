import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar";
import PetCard from "../components/PetCard";

const BrowsePets = () => {
  const navigate = useNavigate();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchPets = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://127.0.0.1:8000/api/pets");
      if (!res.ok) {
        setError("Failed to load pets");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPets(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching pets:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, []);

  // const totalPages = Math.ceil(pets.length / PAGE_SIZE) || 1;
  // const startIndex = (currentPage - 1) * PAGE_SIZE;
  // const visiblePets = pets.slice(startIndex, startIndex + PAGE_SIZE);

  const goPrev = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  // filter by location (shelter name / address / city part)
  const filteredPets = pets.filter((pet) => {
    if (!locationQuery.trim()) return true;

    const q = locationQuery.toLowerCase();
    const name = (pet.shelterName || "").toLowerCase();
    const address = (pet.shelterAddress || "").toLowerCase();

    return name.includes(q) || address.includes(q);
  });

  // pagination uses filteredPets instead of pets
  const totalPages = Math.ceil(filteredPets.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visiblePets = filteredPets.slice(startIndex, startIndex + PAGE_SIZE);

  // suggestions (unique shelter name + address combos)
  const locationSuggestions = Array.from(
    new Set(
      pets
        .map((p) => `${p.shelterName} – ${p.shelterAddress}`)
        .filter((s) => s.toLowerCase().includes(locationQuery.toLowerCase()))
    )
  ).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* NAVBAR */}
      <Navbar>
        <div>
          <Link to="/home" className="text-2xl font-bold text-white p-6">
            Home
          </Link>
          <Link to="/profile" className="text-2xl font-bold text-white p-6">
            Profile
          </Link>
          <Link
            to="/"
            className="text-2xl font-bold text-white p-6"
            onClick={handleLogout}
          >
            Logout
          </Link>
        </div>
      </Navbar>

      {/* push content below navbar */}
      <div className="pt-16">
        {/* FILTER BAR */}
        <section className="bg-[#5699C9] py-10">
          <div className="max-w-5xl mx-auto flex flex-col gap-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center w-full">
                <input
                  type="text"
                  placeholder="Search by shelter, address, or city"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setCurrentPage(1); // reset to first page when searching
                  }}
                  className="w-full md:w-80 bg-white text-gray-800 rounded-full py-3 px-6 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-white mt-2 text-sm">
                  Search by Shelter Location
                </p>
              </div>

              <div className="flex flex-col items-center">
                <button className="w-full md:w-80 bg-blue-300 text-white rounded-full py-3 px-6 flex items-center justify-between shadow-md">
                  <span>Any Animal</span>
                  <span className="text-lg">▼</span>
                </button>
                <p className="text-white mt-2 text-sm">Search by Animal</p>
              </div>
            </div>
          </div>
        </section>

        {/* CARDS GRID */}
        <section className="py-10">
          <div className="flex justify-center gap-4 mb-8">
            <button className="px-8 py-2 rounded-full bg-blue-300 text-white shadow">
              Sex
            </button>
            <button className="px-8 py-2 rounded-full bg-blue-300 text-white shadow">
              Age
            </button>
            <button className="px-8 py-2 rounded-full bg-blue-300 text-white shadow">
              Size
            </button>
          </div>

          {loading && (
            <p className="text-center text-gray-500">Loading pets...</p>
          )}

          {error && !loading && (
            <p className="text-center text-red-500">{error}</p>
          )}

          {!loading && !error && (
            <>
              <div className="max-w-6xl mx-auto w-full px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {visiblePets.map((pet) => (
                  <PetCard key={pet.petID} pet={pet} />
                ))}

                {filteredPets.length === 0 && !loading && !error && (
                  <p className="col-span-full text-center text-gray-500">
                    No pets found for this location.
                  </p>
                )}
              </div>

              {/* Pagination controls */}
              {pets.length > PAGE_SIZE && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={goPrev}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-full border ${
                      currentPage === 1
                        ? "border-gray-300 text-gray-300 cursor-not-allowed"
                        : "border-blue-400 text-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-full border ${
                      currentPage === totalPages
                        ? "border-gray-300 text-gray-300 cursor-not-allowed"
                        : "border-blue-400 text-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default BrowsePets;
