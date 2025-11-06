import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import logo from '../assets/pawLogo.png'

const Login = () => {
    return (
        <>
            <div className='flex h-screen'>
                <div className="w-[60%] bg-blue-200 flex flex-col align-middle justify-center pl-20 text-white">
                    <div className="text-center">
                        <h1 className="text-6xl font-extrabold mb-4">Welcome Back</h1>
                        <p className="text-2xl">You can sign in to access your existing account.</p>
                    </div>
                </div>
                <div className="w-[40%] bg-gray-100 flex flex-col justify-center items-center">
                    <h2 className="text-5xl font-bold text-blue-400 mb-6">Sign In</h2>
                    <input
                    type="text"
                    placeholder="Username or email"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <input
                    type="password"
                    placeholder="Password"
                    className="border border-blue-300 rounded-full p-5 w-80 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    <button className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-4 px-20 rounded-full shadow-lg text-lg transition-all duration-200">
                    Sign In
                    </button>
                </div>
            </div>
            
        </>
    )
}

export default Login
