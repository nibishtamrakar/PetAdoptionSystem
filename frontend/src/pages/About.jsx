import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import logo from '../assets/pawLogo.png'

const About = () => {
    return (
        <>
            <Navbar />
            <div className='flex flex-col w-screen items-center justify-center h-screen bg-gray-200 pt-20'>
                <h1 className='font-extrabold text-4xl mb-4 justify-center text-blue-300'>Pawfect Match</h1>
                <img src={logo} alt="Pawfect Match Logo" className='w-1/3 p-8'/>
            </div>
        </>
    )
}

export default About
