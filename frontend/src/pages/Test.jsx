import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'

const Test = () => {
    return (
        <>
            <Navbar>
                <div>
                    <button>
                    <Link to="/Login" className="text-2xl font-bold text-white p-6 ">
                        Logout
                    </Link>
                    </button>    
                    <button>
                    <Link to="/About" className="text-2xl font-bold text-white p-6 ">
                        About
                    </Link>
                    </button>    
                    <button>
                    <Link to="/About" className="text-2xl font-bold text-white p-6 ">
                        Team
                    </Link>
                    </button>    
                </div>
            </Navbar>
                
        </>
    )
}

export default Test
