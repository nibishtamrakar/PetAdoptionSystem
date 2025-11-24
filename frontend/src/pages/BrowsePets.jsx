import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'

const BrowsePets = () => {

    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <>
            <Navbar>
                <div>
                    <Link to="/Home" className="text-2xl font-bold text-white p-6">
                        Home
                    </Link>

                    <Link to="/Profile" className="text-2xl font-bold text-white p-6">
                        Profile
                    </Link>

                    <button 
                        onClick={handleLogout} 
                        className="text-2xl font-bold text-white p-6"
                    >
                        Logout
                    </button>
                </div>
            </Navbar>
        </>
    )
}

export default BrowsePets
