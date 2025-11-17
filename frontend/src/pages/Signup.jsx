import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import logo from '../assets/pawLogo.png'

const Signup = () => {
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
                    <input
                    type="text"
                    placeholder="Name"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    
                    <input
                    type="text"
                    placeholder="Email"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    
                    <input
                    type="tel"
                    placeholder="Phone Number"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <select
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    defaultValue=""
                    >
                        <option value="" disabled>
                            Select Role
                        </option>
                        <option value="adopter">Adopter</option>
                        <option value="staff">Staff</option>
                        <option value="vet">Vet</option>
                        <option value="admin">Admin</option>
                    </select>

                    <input
                    type="password"
                    placeholder="Password"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 px-20 rounded-full shadow-lg text-lg transition-all duration-200">
                    Sign Up
                    </button>
                </div>
            </div>
            
        </>
    )
}

export default Signup
