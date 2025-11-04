import React from "react"

const Navbar = ({children}) => {
    return(
        <nav className="fixed inset-x-0 top-0 h-16 bg-blue-300 z-50 shadow-md">
            <div className="h-full container mx-auto px-6 flex items-center justify-end">
                {children}
            </div>
        </nav>
    )
}

export default Navbar