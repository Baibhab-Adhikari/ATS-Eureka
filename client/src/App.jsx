import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import EmployeeHome from './pages/EmployeeHome'
import EmployerHome from './pages/EmployerHome'
import ResumeManager from './pages/ResumeManager'
import ApplicationTracker from './pages/ApplicationTracker'
import Profile from './pages/Profile'
import ResumeTailor from './pages/ResumeTailor'
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
            <Route path="/employee/profile" element={<Profile />} />
            <Route path="/employee/resumes" element={<ResumeManager />} />
            <Route path="/employee/tailor" element={<ResumeTailor />} />
            <Route path="/employee/applications" element={<ApplicationTracker />} />
            <Route path="/employer" element={<EmployerHome />} />
            <Route path="/employer/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
    </Router>
  )
}

export default App
