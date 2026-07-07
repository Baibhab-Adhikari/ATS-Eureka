import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, User, LogOut, FileText, Briefcase } from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-[#030412] font-montserrat text-white bg-custom-radial bg-cover">
      {/* Sidebar */}
      <aside className="w-20 bg-white/5 border-r border-white/10 flex flex-col items-center py-8 gap-12 fixed h-full z-20 backdrop-blur-md">
        <Link to="/" className="mb-4 hover:scale-105 transition-transform">
          <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        </Link>
        <div className="flex flex-col gap-8 w-full items-center flex-1">
          <Link to="/employee" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employee') ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`} title="Dashboard">
            <Home className="w-6 h-6" />
          </Link>
          <Link to="/employee/resumes" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employee/resumes') ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`} title="Resume Manager">
            <FileText className="w-6 h-6" />
          </Link>
          <Link to="/employee/applications" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employee/applications') ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`} title="Application Tracker">
            <Briefcase className="w-6 h-6" />
          </Link>
        </div>
        <div className="flex flex-col gap-6 items-center mt-auto">
          <Link to={location.pathname.startsWith('/employer') ? '/employer/profile' : '/employee/profile'} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#02A4FF] to-[#7D40FF] p-[2px] cursor-pointer hover:scale-110 transition-transform" title="Profile">
            <div className="w-full h-full bg-[#030412] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </Link>
          <button onClick={handleLogout} className="p-3 text-white/60 hover:text-red-400 transition-colors" title="Logout">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 flex-1 flex flex-col relative min-h-screen overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
