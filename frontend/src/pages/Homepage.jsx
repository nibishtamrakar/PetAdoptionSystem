import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import logo from '../assets/pawLogo.png'

const HomePage = () => {
    return (
        <>
            <Navbar />
            <div className='flex flex-col w-screen items-center justify-center h-screen bg-gray-200 pt-20'>
                <h1 className='font-extrabold text-4xl mb-4 justify-center text-blue-300'>Pawfect Match</h1>
                <img src={logo} alt="Pawfect Match Logo" className='w-1/3 p-8'/>
                <div className="flex space-x-4 mt-6">
                    <button className="bg-gray-200 border-2 border-gray-500 rounded-2xl px-6 py-2 font-semibold hover:bg-blue-200 hover:scale-110 transition">
                        Sign In
                    </button>
                    <button className="bg-blue-300 text-gray-50 border-2 border-gray-500 rounded-2xl px-6 py-2 font-semibold hover:bg-blue-200 hover:text-black hover:scale-110 transition">
                        Register
                    </button>
                    </div>
            </div>
        </>
    )
}

export default HomePage
