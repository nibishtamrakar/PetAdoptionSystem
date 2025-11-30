import './App.css'
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/Homepage'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BrowsePets from './pages/BrowsePets'
import PetDetail from './pages/PetDetail'
import OldPetDetail from './pages/OldPetDetail'
import StaffDashboard from './pages/StaffDashboard'
import StaffProfile from './pages/StaffProfile'
import AdminDashboard from './pages/AdminDashboard'
import ShelterDetail from './pages/ShelterDetail'
import ProtectedRoute from './components/ProtectedRoute';

const PetRouteWrapper = () => {
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const userRole = user?.role;
  
  if (userRole === "STAFF" || userRole === "ADMIN") {
    return <OldPetDetail />;
  } else {
    return <PetDetail />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/browsepets" element={<BrowsePets />} />
        <Route 
          path="/pet/:id" 
          element={<PetRouteWrapper />}
        />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/staff/profile" element=
          {<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffProfile /> </ProtectedRoute>} />
        <Route path="/admin/shelter/:id" element=
          {<ProtectedRoute allowedRoles={['ADMIN']}>
            <ShelterDetail /> </ProtectedRoute>} />
        <Route path="/admin/dashboard" element=
          {<ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard /> </ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
