import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import AtsAnalysis from './pages/AtsAnalysis'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployerHome from './pages/EmployerHome'
import ResumeManager from './pages/ResumeManager'
import ApplicationTracker from './pages/ApplicationTracker'
import EmployerKanban from './pages/EmployerKanban'
import EmployeeProfile from './pages/EmployeeProfile'
import EmployerProfile from './pages/EmployerProfile'
import ResumeTailor from './pages/ResumeTailor'
import InterviewPrep from './pages/InterviewPrep'
import EmployerDashboard from './pages/EmployerDashboard'
import JdManager from './pages/JdManager'
import EmployerHistory from './pages/EmployerHistory'
import ProtectedRoute from './components/ProtectedRoute'
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
            {/* Employee Routes */}
            <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/employee/ats" element={<ProtectedRoute allowedRole="employee"><AtsAnalysis /></ProtectedRoute>} />
            <Route path="/employee/profile" element={<ProtectedRoute allowedRole="employee"><EmployeeProfile /></ProtectedRoute>} />
            <Route path="/employee/resumes" element={<ProtectedRoute allowedRole="employee"><ResumeManager /></ProtectedRoute>} />
            <Route path="/employee/tailor" element={<ProtectedRoute allowedRole="employee"><ResumeTailor /></ProtectedRoute>} />
            <Route path="/employee/interview" element={<ProtectedRoute allowedRole="employee"><InterviewPrep /></ProtectedRoute>} />
            <Route path="/employee/applications" element={<ProtectedRoute allowedRole="employee"><ApplicationTracker /></ProtectedRoute>} />
            
            {/* Employer Routes */}
            <Route path="/employer" element={<ProtectedRoute allowedRole="employer"><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/ats" element={<ProtectedRoute allowedRole="employer"><EmployerHome /></ProtectedRoute>} />
            <Route path="/employer/profile" element={<ProtectedRoute allowedRole="employer"><EmployerProfile /></ProtectedRoute>} />
            <Route path="/employer/jds" element={<ProtectedRoute allowedRole="employer"><JdManager /></ProtectedRoute>} />
            <Route path="/employer/history" element={<ProtectedRoute allowedRole="employer"><EmployerHistory /></ProtectedRoute>} />
            <Route path="/employer/kanban" element={<ProtectedRoute allowedRole="employer"><EmployerKanban /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster />
    </Router>
  )
}

export default App
