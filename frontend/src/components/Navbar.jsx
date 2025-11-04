import React, { useState } from "react"
import { Link } from "react-router-dom"

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggleMenu = () => {
        setIsOpen(!isOpen)
    }

    return(
        <nav className="fixed top-0 left-0 w-full bg-blue-300 p-8 shadow-md z-50">

        </nav>
    )
}

export default Navbar