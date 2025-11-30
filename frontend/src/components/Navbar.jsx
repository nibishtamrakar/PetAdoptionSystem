import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/homepage", { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-blue-400 text-white py-4 px-8 shadow-lg z-50 flex justify-between items-center">
      {/* Left side - empty */}
      <div></div>

      {/* Right side - Navigation links */}
      <div className="flex gap-8 items-center">
        <Link
          to="/browsepets"
          className="text-white font-semibold text-lg hover:text-blue-100 transition"
        >
          Home
        </Link>
        
        <Link
          to="/profile"
          className="text-white font-semibold text-lg hover:text-blue-100 transition"
        >
          Profile
        </Link>
        
        <button
          onClick={handleLogout}
          className="text-white font-semibold text-lg hover:text-blue-100 transition cursor-pointer bg-transparent border-none p-0"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
import React from "react"
import { Link, useNavigate } from "react-router-dom"

// bg-[#9DD0F5]

const Navbar = ({children}) => {
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/", { replace: true });
    };

    const isAdmin = user && user.role === "ADMIN";
    const isStaff = user && user.role === "STAFF";

    // If custom children are passed, use them (for custom navbar content)
    if (children) {
        return(
            <nav className="fixed inset-x-0 top-0 h-16 bg-blue-300 z-50 shadow-md">
                <div className="h-full container mx-auto px-6 flex items-center justify-end">
                    {children}
                </div>
            </nav>
        )
    }

    // Default navbar based on user role
    return(
        <nav className="fixed inset-x-0 top-0 h-16 bg-blue-300 z-50 shadow-md">
            <div className="h-full container mx-auto px-6 flex items-center justify-end">
                {isAdmin ? (
                    // Admin navigation
                    <div className="flex items-center space-x-6">
                        <Link to="/admin/dashboard" className="text-white font-semibold hover:text-blue-100">
                            Home
                        </Link>
                        <Link to="/admin/dashboard?tab=appointments" className="text-white font-semibold hover:text-blue-100">
                            Appointments
                        </Link>
                        <Link to="/admin/dashboard?tab=history" className="text-white font-semibold hover:text-blue-100">
                            History
                        </Link>
                        <Link to="/admin/dashboard?tab=requests" className="text-white font-semibold hover:text-blue-100">
                            Requests
                        </Link>
                        <Link to="/admin/dashboard?tab=roles" className="text-white font-semibold hover:text-blue-100">
                            Roles
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
                        >
                            Logout
                        </button>
                    </div>
                ) : isStaff ? (
                    // Staff navigation
                    <div className="flex items-center space-x-6">
                        <Link to="/staff/dashboard" className="text-white font-semibold hover:text-blue-100">
                            Home
                        </Link>
                        <Link to="/staff/dashboard?tab=history" className="text-white font-semibold hover:text-blue-100">
                            History
                        </Link>
                        <Link to="/staff/dashboard?tab=requests" className="text-white font-semibold hover:text-blue-100">
                            Requests
                        </Link>
                        <Link to="/staff/profile" className="text-white font-semibold hover:text-blue-100">
                            Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-blue-400 px-4 py-2 rounded-full font-semibold hover:bg-blue-100"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    // Default/empty for regular users
                    <div></div>
                )}
            </div>
        </nav>
    )
}

export default Navbar;