import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, LogOut, Briefcase, Activity, Users, LayoutDashboard, Kanban } from 'lucide-react';

const EmployerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen dark:bg-[#030412] bg-gray-50 font-montserrat dark:text-white text-gray-900 bg-custom-radial bg-cover">
      {/* Sidebar */}
      <aside className="w-20 dark:bg-white/5 bg-white border-r dark:border-white/10 border-gray-200 flex flex-col items-center py-8 gap-12 fixed h-full z-20 backdrop-blur-md">
        <Link to="/" className="mb-4 hover:scale-105 transition-transform">
          <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        </Link>
        <div className="flex flex-col gap-8 w-full items-center flex-1">
          <Link to="/employer" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employer') ? 'dark:bg-white/20 bg-gray-200 dark:text-white text-gray-900' : 'dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900'}`} title="Dashboard">
            <LayoutDashboard className="w-6 h-6" />
          </Link>
          <Link to="/employer/ats" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employer/ats') ? 'dark:bg-white/20 bg-gray-200 dark:text-white text-gray-900' : 'dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900'}`} title="ATS Analysis (Upload)">
            <Activity className="w-6 h-6" />
          </Link>
          <Link to="/employer/kanban" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employer/kanban') ? 'dark:bg-white/20 bg-gray-200 dark:text-white text-gray-900' : 'dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900'}`} title="Hiring Pipeline">
            <Kanban className="w-6 h-6" />
          </Link>
          <Link to="/employer/jds" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employer/jds') ? 'dark:bg-white/20 bg-gray-200 dark:text-white text-gray-900' : 'dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900'}`} title="Job Descriptions">
            <Briefcase className="w-6 h-6" />
          </Link>
          <Link to="/employer/history" className={`p-3 rounded-xl cursor-pointer transition-colors ${isActive('/employer/history') ? 'dark:bg-white/20 bg-gray-200 dark:text-white text-gray-900' : 'dark:bg-white/5 bg-gray-50 dark:text-white/60 text-gray-500 dark:hover:bg-white/10 hover:bg-gray-200 dark:hover:text-white hover:text-gray-900'}`} title="Analysis History">
            <Users className="w-6 h-6" />
          </Link>
        </div>
        <div className="flex flex-col gap-6 items-center mt-auto">
          <Link to="/employer/profile" className={`p-1 rounded-full cursor-pointer transition-colors ${isActive('/employer/profile') ? 'ring-2 dark:ring-white/50 ring-gray-400' : 'ring-1 dark:ring-white/20 ring-gray-300 dark:hover:ring-white/40 hover:ring-gray-400'}`} title="Profile">
            <div className="w-full h-full dark:bg-[#030412] bg-white rounded-full flex items-center justify-center">
              <User className="w-6 h-6 dark:text-white text-gray-900" />
            </div>
          </Link>
          <button onClick={handleLogout} className="p-3 rounded-xl dark:bg-white/5 bg-gray-100 dark:text-white/60 text-gray-500 hover:bg-red-500/20 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-500 transition-colors cursor-pointer" title="Logout">
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

export default EmployerLayout;
