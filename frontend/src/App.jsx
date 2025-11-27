import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'
import BrowsePets from './pages/BrowsePets'
import PetDetail from './pages/PetDetail'
import StaffDashboard from './pages/StaffDashboard'
import { ProtectedRoute } from './services/auth.jsx';

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
      </Routes>
    </Router>
    </>
  )
}

export default App
