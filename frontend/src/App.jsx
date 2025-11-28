import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BrowsePets from './pages/BrowsePets'
import PetDetail from './pages/PetDetail'
import StaffDashboard from './pages/StaffDashboard'
import StaffProfile from './pages/StaffProfile'
import AdminDashboard from './pages/AdminDashboard'
import ShelterDetail from './pages/ShelterDetail'
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/About" element={<About />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/BrowsePets" element={<BrowsePets />} />
        <Route path="/pet/:id" element={<PetDetail />} />
        <Route path="/staff/dashboard" element=
          {<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffDashboard /> </ProtectedRoute>} />
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
    </>
  )
}

export default App
