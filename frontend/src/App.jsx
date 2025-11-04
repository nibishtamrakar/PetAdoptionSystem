import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage'
import About from './pages/About'

function App() {
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/About" element={<About />} />
      </Routes>
    </Router>
    </>
  )
}

export default App
