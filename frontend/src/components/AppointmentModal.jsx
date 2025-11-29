// src/components/AppointmentModal.jsx
import React, { useState } from "react";
import { API_BASE_URL } from "../config";

const AppointmentModal = ({ open, onClose, pet }) => {
  // Read currently logged-in user from localStorage
  const storedUser = typeof window !== "undefined"
    ? localStorage.getItem("user")
    : null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  const adopterID = user?.userID; // 👈 this is what goes to the backend

  const [form, setForm] = useState({
    petID: "",
    shelterID: "",
    appointmentTime: "",
    appointmentType: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (!adopterID) {
      setMessage("No logged-in user found (adopterID missing).");
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        petID: Number(pet.petID),
        shelterID: Number(pet.shelterID),
        appointmentTime: form.appointmentTime,
        appointmentType: form.appointmentType,
      };

      const res = await fetch(`${API_BASE_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = errBody.detail || "Failed to create appointment";
        throw new Error(detail);
      }

      const data = await res.json();
      setMessage(
        `Appointment created${
          data.appointmentID ? ` (ID ${data.appointmentID})` : ""
        }`
      );

      setTimeout(() => {
        setForm({
          petID: "",
          shelterID: "",
          appointmentTime: "",
          appointmentType: "",
        });
        setIsSubmitting(false);
        setMessage("");
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Create appointment error:", err);
      setMessage(`Error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold mb-4">Schedule Appointment for {pet.name}</h2>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="petID"
            >
              Pet ID
            </label>
            <input
              id="petID"
              name="petID"
              type="number"
              min="1"
              value={form.petID}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div> */}

          {/* <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="shelterID"
            >
              Shelter ID
            </label>
            <input
              id="shelterID"
              name="shelterID"
              type="number"
              min="1"
              value={form.shelterID}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div> */}

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="appointmentTime"
            >
              Appointment Time
            </label>
            <input
              id="appointmentTime"
              name="appointmentTime"
              type="datetime-local"
              value={form.appointmentTime}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="appointmentType"
            >
              Appointment Type
            </label>
            <select
              id="appointmentType"
              name="appointmentType"
              value={form.appointmentType}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Select type</option>
              <option value="VISIT">Visit</option>
              <option value="MEET&GREET">Meet &amp; Greet</option>
              <option value="VET">Vet</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-xs text-center text-gray-700">{message}</p>
        )}

        {!adopterID && (
          <p className="mt-2 text-xs text-center text-red-500">
            (No adopterID found – are you logged in?)
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;
