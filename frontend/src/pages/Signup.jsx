import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        password: ""
    });

    const [error, setError] = useState(null);   // ✅ no TS
    const [success, setSuccess] = useState(null); // ✅ no TS

    const handleRoleChange = (e) => {
        setForm({ ...form, role: e.target.value });
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        // validate required fields (include password)
        if (!form.name || !form.email || !form.phone || !form.password) {
            setError("All fields are required");
            return;
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password
                    // role is ignored by backend for now
                })
            });

            let data = null;
            try {
                data = await res.json();
            } catch (_) {
                // ignore JSON parse errors
            }

            if (!res.ok) {
                setError((data && data.detail) || "Signup failed");
                return;
            }

            setSuccess("Account created!");

            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            console.error("Signup error:", err);
            setError("Network error");
        }
    };

    return (
        <>
            <div className='flex h-screen'>
                <div className="w-[60%] bg-blue-300 flex flex-col align-middle justify-center pl-20 text-white">
                    <div className="text-center">
                        <h1 className="text-6xl font-extrabold mb-4">Welcome</h1>
                        <p className="text-2xl">You can create a new account and start finding your PawFect Match.</p>
                    </div>
                </div>

                <div className="w-[40%] bg-gray-100 flex flex-col justify-center items-center">
                    <h2 className="text-5xl font-bold text-blue-400 mb-6">Sign Up</h2>

                    {error && <p className="text-red-500 mb-2">{error}</p>}
                    {success && <p className="text-green-600 mb-2">{success}</p>}

                    <input
                        type="text"
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    {/* <select
                        className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={form.role}
                        onChange={handleRoleChange}
                    >
                        <option value="" disabled>Select Role</option>
                        <option value="adopter">Adopter</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select> */}

                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button
                        className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 px-20 rounded-full shadow-lg text-lg transition-all duration-200"
                        onClick={handleSubmit}
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </>
    )
}

export default Signup
