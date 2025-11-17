import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage'
import About from './pages/About'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/About" element={<About />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
