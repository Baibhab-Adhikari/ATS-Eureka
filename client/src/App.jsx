import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import EmployeeHome from './pages/EmployeeHome'
import EmployerHome from './pages/EmployerHome'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/employee" element={<EmployeeHome />} />
            <Route path="/employer" element={<EmployerHome />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
    </Router>
  )
}

export default App
