import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PetCard from "../components/PetCard";
import { API_BASE_URL } from "../config";
import Filters from "../components/Filters";

const BrowsePets = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [locationQuery, setLocationQuery] = useState("");
  const [animalQuery, setAnimalQuery] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE=20;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (locationQuery) params.append("q_location", locationQuery);
      if (animalQuery) params.append("q_animal", animalQuery);
      params.append("available_only", showOnlyAvailable);  

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/pets?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        setError("Failed to load pets");
        return;
      }

      const data = await res.json();
      setPets(data);
    } catch (err) {
      console.error("Fetch pets error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [locationQuery, animalQuery,showOnlyAvailable]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

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
  const LocationSuggestions = Array.from(
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

      <div className="pt-16">
        {/* FILTER BAR */}
<section className="bg-[#5699C9] py-10">
  <div className="max-w-6xl mx-auto px-4">
    <div className="flex flex-col lg:flex-row items-center gap-6">
      
      {/* Search 1: Shelter */}
      <div className="flex flex-col items-center flex-1">
        <input
          type="text"
          placeholder="Search by shelter, address, or city"
          value={locationQuery}
          onChange={(e) => {
            setLocationQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-white text-gray-800 rounded-full py-3 px-6 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-white mt-2 text-sm">Search by Shelter Location</p>
      </div>

      {/* Search 2: Animal */}
      <div className="flex flex-col items-center flex-1">
        <input
          type="text"
          placeholder="Search by animal species or breed"
          value={animalQuery}
          onChange={(e) => {
            setAnimalQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-white text-gray-800 rounded-full py-3 px-6 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-white mt-2 text-sm">Search by Animal</p>
      </div>

      {/* Toggle: On the Right */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        minWidth: '140px'
      }}>
        <label style={{
          position: 'relative',
          display: 'inline-block',
          width: '60px',
          height: '34px',
          cursor: 'pointer'
        }}>
          <input 
            type="checkbox" 
            checked={showOnlyAvailable}
            onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
            style={{
              opacity: 0,
              width: 0,
              height: 0
            }}
          />
          <span style={{
            position: 'absolute',
            cursor: 'pointer',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: showOnlyAvailable ? '#2196F3' : '#ccc',
            transition: 'background-color 0.4s ease',
            borderRadius: '34px'
          }}>
            <span style={{
              position: 'absolute',
              height: '26px',
              width: '26px',
              left: showOnlyAvailable ? '30px' : '4px',
              bottom: '4px',
              backgroundColor: 'white',
              transition: 'left 0.4s ease',
              borderRadius: '50%'
            }}
            />
          </span>
        </label>
        <span style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '13px',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          {showOnlyAvailable ? "Available" : "All Pets"}
        </span>
      </div>
    </div>
  </div>
</section>


        {/* CARDS GRID */}

        <section className="py-10">
          {/* <div className="flex justify-center gap-4 mb-8">
            <Filters />
          </div> */}

        {/* appointment testing */}
        {/* <section className="py-10">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex justify-center gap-4">
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

            <button
              onClick={() => setShowAppointmentModal(true)}
              className="px-8 py-2 rounded-full bg-green-500 text-white shadow hover:bg-green-600"
            >
              Schedule Appointment (Test)
            </button>
          </div> */}


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
