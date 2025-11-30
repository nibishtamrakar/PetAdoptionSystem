import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

const ShelterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shelter, setShelter] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShelterData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        // Fetch shelter details
        const shelterResponse = await fetch(`${API_BASE_URL}/api/admin/shelters/${id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!shelterResponse.ok) {
          throw new Error("Failed to fetch shelter details");
        }

        const shelterData = await shelterResponse.json();
        setShelter(shelterData);

        // Fetch shelter pets
        const petsResponse = await fetch(`${API_BASE_URL}/api/admin/shelters/${id}/pets`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (petsResponse.ok) {
          const petsData = await petsResponse.json();
          setPets(petsData);
        }

      } catch (err) {
        console.error("Error fetching shelter data:", err);
        setError("Failed to load shelter information");
      } finally {
        setLoading(false);
      }
    };

    fetchShelterData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=appointments")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=history")}
              className="text-white font-semibold hover:text-blue-100"
            >
              History
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=requests")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Requests
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=roles")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Roles
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/", { replace: true });
              }}
              className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
            >
              Logout
            </button>
          </div>
        </Navbar>
        <div className="pt-20 flex justify-center items-center h-96">
          <div className="text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !shelter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=appointments")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=history")}
              className="text-white font-semibold hover:text-blue-100"
            >
              History
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=requests")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Requests
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=roles")}
              className="text-white font-semibold hover:text-blue-100"
            >
              Roles
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("user");
                localStorage.removeItem("token");
                navigate("/", { replace: true });
              }}
              className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
            >
              Logout
            </button>
          </div>
        </Navbar>
        <div className="pt-20 flex justify-center items-center h-96">
          <div className="text-2xl text-red-600">{error || "Shelter not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar>
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-white font-semibold hover:text-blue-100"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/admin/dashboard?tab=appointments")}
            className="text-white font-semibold hover:text-blue-100"
          >
            Appointments
          </button>
          <button
            onClick={() => navigate("/admin/dashboard?tab=history")}
            className="text-white font-semibold hover:text-blue-100"
          >
            History
          </button>
          <button
            onClick={() => navigate("/admin/dashboard?tab=requests")}
            className="text-white font-semibold hover:text-blue-100"
          >
            Requests
          </button>
          <button
            onClick={() => navigate("/admin/dashboard?tab=roles")}
            className="text-white font-semibold hover:text-blue-100"
          >
            Roles
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              navigate("/", { replace: true });
            }}
            className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
          >
            Logout
          </button>
        </div>
      </Navbar>
      <div className="pt-20 container mx-auto px-4 py-8">
        {/* Shelter Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{shelter.name}</h1>
              <p className="text-gray-600 mb-2">{shelter.address}</p>
              <p className="text-gray-600 mb-2">📞 {shelter.phone}</p>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Shelter Pets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Pets at {shelter.name}</h2>
          {pets.length === 0 ? (
            <p className="text-gray-600">No pets currently available at this shelter.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div key={pet.petID} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{pet.name}</h3>
                    <p className="text-gray-600">{pet.species} - {pet.breed}</p>
                    <p className="text-gray-600">{pet.sex} • {pet.status}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/pet/${pet.petID}`)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      View Details
                    </button>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      pet.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      pet.status === 'ADOPTED' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {pet.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelterDetail;
