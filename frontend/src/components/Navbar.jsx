import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


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